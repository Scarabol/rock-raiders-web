import { Group, Mesh, MeshPhongMaterial, Vector2, Vector3 } from 'three'
import { clearTimeoutSafe, getRandom, getRandomSign } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { SelectionEvent, SurfaceChanged, SurfaceSelectedEvent } from '../../../event/LocalEvents'
import { CavernDiscovered, JobCreateEvent, JobDeleteEvent, OreFoundEvent } from '../../../event/WorldEvents'
import { CrystalFoundEvent, LandslideEvent } from '../../../event/WorldLocationEvent'
import { HEIGHT_MULTIPLER, TILESIZE } from '../../../params'
import { LWSCLoader } from '../../../resource/LWSCLoader'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { AnimSubObj } from '../anim/AnimSubObj'
import { BuildingEntity } from '../building/BuildingEntity'
import { Crystal } from '../collect/Crystal'
import { Dynamite } from '../collect/Dynamite'
import { ElectricFence } from '../collect/ElectricFence'
import { Ore } from '../collect/Ore'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { CarryDynamiteJob } from '../job/surface/CarryDynamiteJob'
import { ClearRubbleJob } from '../job/surface/ClearRubbleJob'
import { DrillJob } from '../job/surface/DrillJob'
import { ReinforceJob } from '../job/surface/ReinforceJob'
import { Selectable, SelectionType } from '../Selectable'
import { SurfaceGeometry } from './SurfaceGeometry'
import { SurfaceType } from './SurfaceType'
import { Terrain } from './Terrain'
import { WALL_TYPE } from './WallType'

export class Surface implements Selectable {

    terrain: Terrain
    worldMgr: WorldManager
    sceneMgr: SceneManager
    surfaceType: SurfaceType
    x: number
    y: number
    containedOres: number = 0
    containedCrystals: number = 0
    heightOffset: number = null
    discovered: boolean = false
    selected: boolean = false
    reinforced: boolean = false
    drillJob: DrillJob = null
    reinforceJob: ReinforceJob = null
    dynamiteJob: CarryDynamiteJob = null
    clearRubbleJob: ClearRubbleJob = null
    surfaceRotation: number = 0
    seamLevel: number = 0
    fallinTimeout = null

    fallinGrp: Group = null
    animationTimeout = null

    wallType: WALL_TYPE = null
    mesh: Mesh = null
    needsMeshUpdate: boolean = false

    topLeftHeightOffset: number = 0
    topRightHeightOffset: number = 0
    bottomLeftHeightOffset: number = 0
    bottomRightHeightOffset: number = 0

    rubblePositions: Vector2[] = []

    building: BuildingEntity = null
    fence: ElectricFence = null
    hasPower: boolean = false

    constructor(terrain: Terrain, surfaceType: SurfaceType, x: number, y: number, heightOffset: number) {
        this.terrain = terrain
        this.worldMgr = this.terrain.worldMgr
        this.sceneMgr = this.terrain.sceneMgr
        this.surfaceType = surfaceType
        if (surfaceType === SurfaceType.CRYSTAL_SEAM || surfaceType === SurfaceType.ORE_SEAM) this.seamLevel = 4
        this.x = x
        this.y = y
        this.heightOffset = heightOffset
    }

    /**
     * @return {boolean} Returns true, if a new cave has been discovered
     */
    discover(): boolean {
        if (!this.discovered) GameState.discoverSurface(this)
        this.discovered = true
        this.needsMeshUpdate = true
        let foundCave = false
        if (this.surfaceType.floor) {
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= +1; y++) {
                    if (x === 0 && y === 0) continue
                    const surf = this.terrain.getSurfaceOrNull(this.x + x, this.y + y)
                    if (surf && !surf.discovered) {
                        foundCave = surf.discover() || surf.surfaceType.floor
                    }
                }
            }
        }
        return foundCave
    }

    collapse() {
        this.cancelJobs()
        this.fallinTimeout = clearTimeoutSafe(this.fallinTimeout)
        this.surfaceType = SurfaceType.RUBBLE4
        this.rubblePositions = [this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition()]
        this.containedOres += 4
        this.needsMeshUpdate = true
        const foundCave = this.discover()
        if (foundCave) EventBus.publishEvent(new CavernDiscovered())
        // drop contained ores and crystals
        this.dropContainedOre(this.containedOres - 4)
        for (let c = 0; c < this.containedCrystals; c++) {
            const crystal = this.worldMgr.placeMaterial(new Crystal(this.worldMgr, this.sceneMgr), this.getRandomPosition())
            EventBus.publishEvent(new CrystalFoundEvent(crystal.getPosition()))
        }
        // check for unsupported neighbors
        for (let x = this.x - 1; x <= this.x + 1; x++) {
            for (let y = this.y - 1; y <= this.y + 1; y++) {
                if (x !== this.x || y !== this.y) {
                    const surf = this.terrain.getSurface(x, y)
                    surf.needsMeshUpdate = true
                    if (!surf.isSupported()) surf.collapse()
                }
            }
        }
        // update meshes
        this.terrain.updateSurfaceMeshes()
        this.terrain.floorGroup.updateWorldMatrix(true, true)
    }

    private dropContainedOre(dropAmount: number) {
        for (let c = 0; c < dropAmount && this.containedOres > 0; c++) {
            this.containedOres--
            this.worldMgr.placeMaterial(new Ore(this.worldMgr, this.sceneMgr), this.getRandomPosition())
            EventBus.publishEvent(new OreFoundEvent())
        }
    }

    getRandomPosition(): Vector2 {
        return new Vector2(this.x * TILESIZE + TILESIZE / 2 + getRandomSign() * getRandom(TILESIZE / 4),
            this.y * TILESIZE + TILESIZE / 2 + getRandomSign() * getRandom(TILESIZE / 4))
    }

    cancelJobs() {
        this.drillJob = Surface.safeRemoveJob(this.drillJob)
        this.reinforceJob = Surface.safeRemoveJob(this.reinforceJob)
        this.dynamiteJob = Surface.safeRemoveJob(this.dynamiteJob)
        this.clearRubbleJob = Surface.safeRemoveJob(this.clearRubbleJob)
        this.updateJobColor()
    }

    private static safeRemoveJob(job: DrillJob | ReinforceJob | CarryDynamiteJob | ClearRubbleJob) {
        if (job) EventBus.publishEvent(new JobDeleteEvent(job))
        return null
    }

    reduceRubble() {
        this.rubblePositions.shift()
        if (this.surfaceType === SurfaceType.RUBBLE4) this.surfaceType = SurfaceType.RUBBLE3
        else if (this.surfaceType === SurfaceType.RUBBLE3) this.surfaceType = SurfaceType.RUBBLE2
        else if (this.surfaceType === SurfaceType.RUBBLE2) this.surfaceType = SurfaceType.RUBBLE1
        else if (this.surfaceType === SurfaceType.RUBBLE1) this.surfaceType = SurfaceType.GROUND
        this.dropContainedOre(this.containedOres - this.rubblePositions.length)
        this.updateTexture()
        EventBus.publishEvent(new SurfaceChanged(this))
    }

    isSupported(): boolean {
        if (this.surfaceType.floor) return true
        const surfLeft = this.terrain.getSurface(this.x - 1, this.y)
        const surfTopLeft = this.terrain.getSurface(this.x - 1, this.y - 1)
        const surfTop = this.terrain.getSurface(this.x, this.y - 1)
        const surfTopRight = this.terrain.getSurface(this.x + 1, this.y - 1)
        const surfRight = this.terrain.getSurface(this.x + 1, this.y)
        const surfBottomRight = this.terrain.getSurface(this.x + 1, this.y + 1)
        const surfBottom = this.terrain.getSurface(this.x, this.y + 1)
        const surfBottomLeft = this.terrain.getSurface(this.x - 1, this.y + 1)

        function isHighGround(surf1: Surface, surf2: Surface, surf3: Surface) {
            return !surf1.discovered || !surf2.discovered || !surf3.discovered ||
                (!surf1.surfaceType.floor && !surf2.surfaceType.floor && !surf3.surfaceType.floor)
        }

        return isHighGround(surfLeft, surfTopLeft, surfTop)
            || isHighGround(surfTop, surfTopRight, surfRight)
            || isHighGround(surfRight, surfBottomRight, surfBottom)
            || isHighGround(surfBottom, surfBottomLeft, surfLeft)
    }

    updateMesh(force: boolean = true) {
        if (!force && !this.needsMeshUpdate) return
        this.needsMeshUpdate = false

        const topLeftVertex = new Vector3(this.x, 0, this.y)
        const topRightVertex = new Vector3(this.x + 1, 0, this.y)
        const bottomLeftVertex = new Vector3(this.x, 0, this.y + 1)
        const bottomRightVertex = new Vector3(this.x + 1, 0, this.y + 1)

        const surfLeft = this.terrain.getSurface(this.x - 1, this.y)
        const surfTopLeft = this.terrain.getSurface(this.x - 1, this.y - 1)
        const surfTop = this.terrain.getSurface(this.x, this.y - 1)
        const surfTopRight = this.terrain.getSurface(this.x + 1, this.y - 1)
        const surfRight = this.terrain.getSurface(this.x + 1, this.y)
        const surfBottomRight = this.terrain.getSurface(this.x + 1, this.y + 1)
        const surfBottom = this.terrain.getSurface(this.x, this.y + 1)
        const surfBottomLeft = this.terrain.getSurface(this.x - 1, this.y + 1)

        function isHighGround(surf1: Surface, surf2: Surface, surf3: Surface) {
            return !surf1.discovered || !surf2.discovered || !surf3.discovered ||
                (!surf1.surfaceType.floor && !surf2.surfaceType.floor && !surf3.surfaceType.floor)
        }

        if (!this.discovered) {
            topLeftVertex.y = 1
            topRightVertex.y = 1
            bottomRightVertex.y = 1
            bottomLeftVertex.y = 1
        } else if (!this.surfaceType.floor) {
            if (isHighGround(surfLeft, surfTopLeft, surfTop)) topLeftVertex.y = 1
            if (isHighGround(surfTop, surfTopRight, surfRight)) topRightVertex.y = 1
            if (isHighGround(surfRight, surfBottomRight, surfBottom)) bottomRightVertex.y = 1
            if (isHighGround(surfBottom, surfBottomLeft, surfLeft)) bottomLeftVertex.y = 1
        }

        // update mesh (geometry), if wall type changed
        let wallType = topLeftVertex.y + topRightVertex.y + bottomRightVertex.y + bottomLeftVertex.y
        if (wallType === WALL_TYPE.WALL && topLeftVertex.y === bottomRightVertex.y) wallType = WALL_TYPE.WEIRD_CREVICE

        if (this.wallType !== wallType) {
            this.wallType = wallType
            this.updateGeometry(topLeftVertex, bottomRightVertex, topRightVertex, bottomLeftVertex, surfTopLeft, surfTop, surfLeft, surfTopRight, surfRight, surfBottomRight, surfBottom, surfBottomLeft)
            if (this.wallType !== WALL_TYPE.WALL) this.cancelReinforceJobs()
        }

        this.updateTexture()
        this.updateJobColor()
        this.updateGraphWalk()
    }

    private updateGraphWalk() {
        const weight = this.getGraphWalkWeight()
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                this.terrain.graphWalk.grid[this.x * 3 + x][this.y * 3 + y].weight = weight
            }
        }
    }

    cancelReinforceJobs() {
        this.reinforceJob = Surface.safeRemoveJob(this.reinforceJob)
        this.updateJobColor()
    }

    updateTexture() {
        let textureName = this.terrain.textureSet.texturebasename
        if (!this.discovered) {
            textureName += '70'
        } else if (this.surfaceType === SurfaceType.POWER_PATH) {
            textureName += this.updatePowerPathTexture()
        } else if (!this.surfaceType.shaping) {
            if (this.surfaceType === SurfaceType.POWER_PATH_BUILDING && this.hasPower) {
                textureName += '66'
            } else {
                textureName += this.surfaceType.matIndex.toString()
            }
        } else if (this.wallType === WALL_TYPE.WEIRD_CREVICE) {
            textureName += '77'
        } else {
            if (this.wallType === WALL_TYPE.CORNER) {
                textureName += '5'
            } else if (this.wallType === WALL_TYPE.INVERTED_CORNER) {
                textureName += '3'
            } else if (this.reinforced) {
                textureName += '2'
            } else {
                textureName += '0'
            }
            textureName += this.surfaceType.matIndex
        }
        textureName += '.bmp'

        const texture = ResourceManager.getTexture(textureName)
        texture.center.set(0.5, 0.5)
        texture.rotation = this.surfaceRotation

        this.accessMaterials().forEach((mat) => mat.map = texture)
    }

    private updatePowerPathTexture(): string {
        this.surfaceRotation = 0
        const left = this.terrain.getSurface(this.x - 1, this.y).isPath()
        const top = this.terrain.getSurface(this.x, this.y - 1).isPath()
        const right = this.terrain.getSurface(this.x + 1, this.y).isPath()
        const bottom = this.terrain.getSurface(this.x, this.y + 1).isPath()
        const pathSum = (left ? 1 : 0) + (top ? 1 : 0) + (right ? 1 : 0) + (bottom ? 1 : 0)
        if (pathSum === 0 || pathSum === 1) {
            if (left) this.surfaceRotation = -Math.PI / 2
            if (top) this.surfaceRotation = Math.PI
            if (right) this.surfaceRotation = Math.PI / 2
            return this.hasPower ? '75' : '65'
        } else if (pathSum === 2) {
            if (left === right) {
                this.surfaceRotation = left ? Math.PI / 2 : 0
                return this.hasPower ? '72' : '62'
            } else {
                if (left && bottom) this.surfaceRotation = -Math.PI / 2
                if (left && top) this.surfaceRotation = Math.PI
                if (top && right) this.surfaceRotation = Math.PI / 2
                return this.hasPower ? '73' : '63'
            }
        } else if (pathSum === 3) {
            if (!top) this.surfaceRotation = -Math.PI / 2
            if (!right) this.surfaceRotation = Math.PI
            if (!bottom) this.surfaceRotation = Math.PI / 2
            return this.hasPower ? '74' : '64'
        } else {
            return this.hasPower ? '71' : '60'
        }
    }

    accessMaterials(): MeshPhongMaterial[] {
        if (!this.mesh || !this.mesh.material) return []
        if (Array.isArray(this.mesh.material)) {
            return this.mesh.material as MeshPhongMaterial[]
        } else {
            return [this.mesh.material as MeshPhongMaterial]
        }
    }

    updateGeometry(topLeftVertex: Vector3, bottomRightVertex: Vector3, topRightVertex: Vector3, bottomLeftVertex: Vector3, surfTopLeft: Surface, surfTop: Surface, surfLeft: Surface, surfTopRight: Surface, surfRight: Surface, surfBottomRight: Surface, surfBottom: Surface, surfBottomLeft: Surface) {
        if (this.mesh) this.terrain.floorGroup.remove(this.mesh)
        this.mesh?.geometry?.dispose()

        function avgHeight(...args: Surface[]) {
            let sum = 0, cnt = 0
            args.map(s => s.heightOffset).filter(Boolean).forEach(h => {
                sum += h
                cnt++
            })
            return sum / cnt
        }

        this.topLeftHeightOffset = avgHeight(surfTopLeft, surfTop, this, surfLeft) * HEIGHT_MULTIPLER
        this.topRightHeightOffset = avgHeight(surfTop, surfTopRight, surfRight, this) * HEIGHT_MULTIPLER
        this.bottomRightHeightOffset = avgHeight(this, surfRight, surfBottomRight, surfBottom) * HEIGHT_MULTIPLER
        this.bottomLeftHeightOffset = avgHeight(surfLeft, this, surfBottom, surfBottomLeft) * HEIGHT_MULTIPLER
        const geometry = SurfaceGeometry.create(this.wallType, topLeftVertex, bottomRightVertex, topRightVertex, bottomLeftVertex,
            topLeftVertex.y + this.topLeftHeightOffset,
            topRightVertex.y + this.topRightHeightOffset,
            bottomRightVertex.y + this.bottomRightHeightOffset,
            bottomLeftVertex.y + this.bottomLeftHeightOffset,
        )

        this.mesh = new Mesh(geometry, new MeshPhongMaterial({shininess: 0}))
        this.mesh.userData = {selectable: this, surface: this}

        this.terrain.floorGroup.add(this.mesh)
        this.terrain.floorGroup.updateWorldMatrix(true, true) // otherwise ray intersection is not working before rendering
    }

    getSelectionType(): SelectionType {
        return SelectionType.SURFACE
    }

    select(): SelectionEvent {
        if (this.surfaceType.selectable && (this.wallType !== WALL_TYPE.INVERTED_CORNER && this.wallType !== WALL_TYPE.WEIRD_CREVICE) && !this.selected && this.discovered) {
            this.selected = true
            this.accessMaterials().forEach((mat) => mat.color.setHex(0x6060a0))
            return new SurfaceSelectedEvent(this)
        }
        return null
    }

    deselect(): any {
        if (this.selected) {
            this.selected = false
            this.updateJobColor()
        }
    }

    getSelectionCenter(): Vector3 {
        return null // not used
    }

    updateJobColor() {
        const color = this.dynamiteJob?.color || this.reinforceJob?.color || this.drillJob?.color || 0xffffff
        this.accessMaterials().forEach((mat) => mat.color.setHex(color))
    }

    hasRubble(): boolean {
        return this.rubblePositions.length > 0
    }

    isPath(): boolean {
        return this.surfaceType === SurfaceType.POWER_PATH || this.surfaceType === SurfaceType.POWER_PATH_BUILDING
    }

    isWalkable(): boolean {
        return this.surfaceType.floor && this.discovered && this.surfaceType !== SurfaceType.LAVA && this.surfaceType !== SurfaceType.WATER && !this.building?.blocksPathSurface
    }

    isDrillable(): boolean {
        return this.surfaceType.drillable && this.discovered && (this.wallType === WALL_TYPE.WALL || this.wallType === WALL_TYPE.CORNER)
    }

    isDrillableHard(): boolean {
        return this.surfaceType.drillableHard && this.discovered && (this.wallType === WALL_TYPE.WALL || this.wallType === WALL_TYPE.CORNER)
    }

    isReinforcable(): boolean {
        return this.surfaceType.reinforcable && this.discovered && this.wallType === WALL_TYPE.WALL && !this.reinforced
    }

    isExplodable(): boolean {
        return this.surfaceType.explodable && this.discovered && (this.wallType === WALL_TYPE.WALL || this.wallType === WALL_TYPE.CORNER)
    }

    isDigable(): boolean {
        return this.isDrillable() || this.isExplodable()
    }

    getDigPositions(): Vector2[] {
        const digPosition = []
        if (this.terrain.getSurface(this.x - 1, this.y).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE - 1, this.y * TILESIZE + TILESIZE / 2))
        if (this.terrain.getSurface(this.x, this.y - 1).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE + TILESIZE / 2, this.y * TILESIZE - 1))
        if (this.terrain.getSurface(this.x + 1, this.y).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE + TILESIZE + 1, this.y * TILESIZE + TILESIZE / 2))
        if (this.terrain.getSurface(this.x, this.y + 1).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE + TILESIZE / 2, this.y * TILESIZE + TILESIZE + 1))
        return digPosition
    }

    reinforce() {
        this.reinforced = true
        this.cancelReinforceJobs()
        this.fallinTimeout = clearTimeoutSafe(this.fallinTimeout)
        this.updateTexture()
    }

    getCenterWorld2D(): Vector2 {
        return new Vector2(this.x, this.y).addScalar(0.5).multiplyScalar(TILESIZE)
    }

    getCenterWorld(): Vector3 {
        const center = this.getCenterWorld2D()
        return new Vector3(center.x, this.sceneMgr.getTerrainHeight(center.x, center.y), center.y)
    }

    setFallinLevel(fallinLevel: number) {
        if (fallinLevel < 1) return
        let originPos
        let targetPos
        if (this.surfaceType.floor) {
            originPos = this.terrain.findFallInOrigin(this.x, this.y)
            targetPos = [this.x, this.y]
        } else {
            originPos = [this.x, this.y]
            targetPos = this.terrain.findFallInTarget(this.x, this.y)
        }
        if (originPos && targetPos) {
            this.terrain.getSurface(originPos[0], originPos[1]).scheduleFallin(targetPos[0], targetPos[1])
        }
    }

    scheduleFallin(targetX: number, targetY: number) {
        this.fallinTimeout = setTimeout(() => {
            this.createFallin(targetX, targetY)
            this.scheduleFallin(targetX, targetY)
        }, (30 + getRandom(60)) * 1000) // TODO adapt timer to level multiplier and fallin value
    }

    createFallin(targetX: number, targetY: number) {
        const fallinPosition = this.terrain.getSurface(targetX, targetY).getCenterWorld()
        EventBus.publishEvent(new LandslideEvent(fallinPosition))

        // TODO refactor mesh and animation handling
        const content = ResourceManager.getResource('MiscAnims/RockFall/Rock3Sides.lws')
        const animation = new LWSCLoader('MiscAnims/RockFall/').parse(content)
        this.fallinGrp = new Group()
        this.fallinGrp.position.copy(fallinPosition)
        const dx = this.x - targetX, dy = targetY - this.y
        this.fallinGrp.rotateOnAxis(new Vector3(0, 1, 0), Math.atan2(dy, dx) + Math.PI / 2)
        this.sceneMgr.scene.add(this.fallinGrp)
        const poly = []
        animation.bodies.forEach((body) => {
            const polyModel = body.model.clone(true)
            poly.push(polyModel)
        })
        animation.bodies.forEach((body, index) => { // not all bodies may have been added in first iteration
            const polyPart = poly[index]
            const parentInd = body.parentObjInd
            if (parentInd !== undefined && parentInd !== null) { // can be 0
                poly[parentInd].add(polyPart)
            } else {
                this.fallinGrp.add(polyPart)
            }
        })
        this.animate(poly, animation, 0)

        this.terrain.getSurface(targetX, targetY).makeRubble()
    }

    animate(poly, animation, frameIndex) {
        if (poly.length !== animation.bodies.length) throw 'Cannot animate poly. Length differs from bodies length'
        animation.bodies.forEach((body: AnimSubObj, index) => {
            const p = poly[index]
            p.position.copy(body.relPos[frameIndex])
            p.rotation.copy(body.relRot[frameIndex])
            p.scale.copy(body.relScale[frameIndex])
            if (p.hasOwnProperty('material')) {
                const material = p['material']
                const opacity = body.opacity[frameIndex]
                if (material && opacity !== undefined) {
                    const matArr = Array.isArray(material) ? material : [material]
                    matArr.forEach((mat: MeshPhongMaterial) => {
                        mat.opacity = opacity
                        mat.transparent = mat.transparent || mat.opacity < 1
                    })
                }
            }
        })
        this.animationTimeout = null
        if (!(frameIndex + 1 > animation.lastFrame) || animation.looping) {
            let nextFrame = frameIndex + 1
            if (nextFrame > animation.lastFrame) {
                nextFrame = animation.firstFrame
            }
            const that = this
            this.animationTimeout = setTimeout(() => that.animate(poly, animation, nextFrame), 1000 / animation.framesPerSecond * animation.transcoef)
        } else {
            this.sceneMgr.scene.remove(this.fallinGrp)
            this.fallinGrp = null
        }
    }

    dispose() {
        this.fallinTimeout = clearTimeoutSafe(this.fallinTimeout)
        this.accessMaterials().forEach(m => m.dispose())
        this.mesh?.geometry?.dispose()
    }

    getFloorHeight(worldX: number, worldZ: number) {
        const sx = worldX / TILESIZE - this.x
        const sy = worldZ / TILESIZE - this.y
        const dy0 = Surface.interpolate(this.topLeftHeightOffset, this.topRightHeightOffset, sx)
        const dy1 = Surface.interpolate(this.bottomLeftHeightOffset, this.bottomRightHeightOffset, sx)
        return Surface.interpolate(dy0, dy1, sy) * TILESIZE
    }

    private static interpolate(y0: number, y1: number, x: number): number {
        return y0 + x * (y1 - y0)
    }

    get neighbors(): Surface[] {
        return [this.terrain.getSurface(this.x - 1, this.y), this.terrain.getSurface(this.x, this.y - 1),
            this.terrain.getSurface(this.x + 1, this.y), this.terrain.getSurface(this.x, this.y + 1)]
    }

    makeRubble(containedOre: number = 0) {
        this.rubblePositions = [this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition()]
        this.containedOres += containedOre
        this.surfaceType = SurfaceType.RUBBLE4
        this.updateTexture()
    }

    setBuilding(building: BuildingEntity) {
        this.building = building
        this.updateGraphWalk()
    }

    getGraphWalkWeight(): number {
        return this.isWalkable() ? this.hasRubble() ? 4 : 1 : 0
    }

    setHasPower(state: boolean, recursive: boolean) {
        if (this.hasPower === state) return
        this.hasPower = state
        this.updateTexture()
        if (recursive) this.neighbors.forEach((n) => n.isPath() && n.setHasPower(state, recursive))
    }

    canPlaceFence(): boolean { // TODO performance this can be cached
        return (this.surfaceType === SurfaceType.GROUND || this.isPath()) && !this.building && !this.fence &&
            [1, 2].some((n) => {
                return !!this.terrain.getSurface(this.x - n, this.y).building ||
                    !!this.terrain.getSurface(this.x, this.y - n).building ||
                    !!this.terrain.getSurface(this.x + n, this.y).building ||
                    !!this.terrain.getSurface(this.x, this.y + n).building ||
                    !!this.terrain.getSurface(this.x - n, this.y).fence ||
                    !!this.terrain.getSurface(this.x, this.y - n).fence ||
                    !!this.terrain.getSurface(this.x + n, this.y).fence ||
                    !!this.terrain.getSurface(this.x, this.y + n).fence
            })
    }

    createDrillJob(): DrillJob {
        if (!this.drillJob) {
            this.drillJob = new DrillJob(this)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.drillJob))
        }
        return this.drillJob
    }

    createReinforceJob(): ReinforceJob {
        if (!this.reinforceJob) {
            this.reinforceJob = new ReinforceJob(this)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.reinforceJob))
        }
        return this.reinforceJob
    }

    createDynamiteJob(): CarryDynamiteJob {
        if (!this.dynamiteJob) {
            const targetBuilding = GameState.getClosestBuildingByType(this.getCenterWorld(), EntityType.TOOLSTATION) // XXX performance cache this
            if (!targetBuilding) throw 'Could not find toolstation to spawn dynamite'
            const dynamite = new Dynamite(this.worldMgr, this.sceneMgr, this)
            dynamite.addToScene(targetBuilding.getDropPosition2D(), targetBuilding.getHeading())
            this.dynamiteJob = new CarryDynamiteJob(dynamite)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.dynamiteJob))
        }
        return this.dynamiteJob
    }

    createClearRubbleJob(): ClearRubbleJob {
        if (!this.clearRubbleJob) {
            this.clearRubbleJob = new ClearRubbleJob(this)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.clearRubbleJob))
        }
        return this.clearRubbleJob
    }

}
