import { Group, Mesh, MeshPhongMaterial, Vector3 } from 'three'
import { Terrain } from './Terrain'
import { SurfaceType } from './SurfaceType'
import { ResourceManager } from '../../../resource/ResourceManager'
import { Selectable, SelectionType } from '../../../game/model/Selectable'
import { EventBus } from '../../../event/EventBus'
import { SurfaceSelectedEvent } from '../../../event/LocalEvents'
import { JobType } from '../../../game/model/job/Job'
import { JobCreateEvent, JobDeleteEvent } from '../../../event/WorldEvents'
import { getRandom, getRandomSign } from '../../../core/Util'
import { Crystal } from '../collect/Crystal'
import { Ore } from '../collect/Ore'
import { HEIGHT_MULTIPLER, TILESIZE } from '../../../main'
import { GameState } from '../../../game/model/GameState'
import { SurfaceJob, SurfaceJobType } from '../../../game/model/job/SurfaceJob'
import { LWSCLoader } from '../../../resource/LWSCLoader'
import { AnimSubObj } from '../anim/AnimSubObj'
import { SurfaceGeometry } from './SurfaceGeometry'
import { LandslideEvent } from '../../../event/WorldLocationEvent'

export class Surface implements Selectable {

    terrain: Terrain
    surfaceType: SurfaceType
    x: number
    y: number
    containedOres: number = 0
    containedCrystals: number = 0
    heightOffset: number = null
    discovered: boolean = false
    selected: boolean = false
    reinforced: boolean = false
    jobs: SurfaceJob[] = []
    surfaceRotation: number = 0
    seamLevel: number = 0
    fallinTimeout = null

    fallinGrp: Group = null
    animationTimeout = null

    wallType: WALL_TYPE = null
    mesh: Mesh = null
    needsMeshUpdate: boolean = false

    constructor(terrain: Terrain, surfaceType: SurfaceType, x: number, y: number, heightOffset: number) {
        this.terrain = terrain
        this.surfaceType = surfaceType
        if (surfaceType === SurfaceType.CRYSTAL_SEAM || surfaceType === SurfaceType.ORE_SEAM) this.seamLevel = 4
        this.x = x
        this.y = y
        this.heightOffset = heightOffset
        EventBus.registerEventListener(JobCreateEvent.eventKey, (event: JobCreateEvent) => {
            const jobType = event.job.type
            if (jobType === JobType.SURFACE) {
                const surfaceJob = event.job as SurfaceJob
                if (surfaceJob.surface === this) this.jobs.push(surfaceJob)
            }
        })
    }

    hasJobType(type: SurfaceJobType) {
        return this.jobs.some((job) => job.workType === type)
    }

    /**
     * @return {boolean} Returns true, if a new cave has been discovered
     */
    discoverNeighbors(): boolean {
        if (!this.discovered) GameState.discoverSurface(this)
        this.discovered = true
        this.needsMeshUpdate = true
        let foundCave = false
        if (this.surfaceType.floor) {
            for (let x = this.x - 1; x <= this.x + 1; x++) {
                for (let y = this.y - 1; y <= this.y + 1; y++) {
                    if (x !== this.x || y !== this.y) {
                        const surf = this.terrain.getSurfaceOrNull(x, y)
                        if (surf && !surf.discovered) {
                            foundCave = surf.discoverNeighbors() || surf.surfaceType.floor
                            surf.needsMeshUpdate = true
                        }
                    }
                }
            }
        }
        return foundCave
    }

    collapse() {
        this.cancelJobs()
        if (this.fallinTimeout) clearTimeout(this.fallinTimeout)
        this.surfaceType = SurfaceType.RUBBLE4
        this.containedOres += 4
        this.needsMeshUpdate = true
        // discover surface and all neighbors
        const foundCave = this.discoverNeighbors()
        if (foundCave) {
            GameState.discoveredCaverns++ // TODO emit new-cave event instead
            console.log('A new cave has been discovered')
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
        // drop contained crystals and ores
        for (let c = 0; c < this.containedCrystals; c++) {
            const x = this.x * TILESIZE + TILESIZE / 2 + getRandomSign() * getRandom(TILESIZE / 4)
            const z = this.y * TILESIZE + TILESIZE / 2 + getRandomSign() * getRandom(TILESIZE / 4)
            this.terrain.worldMgr.addCollectable(new Crystal(), x, z)
        }
        this.dropContainedOre(this.containedOres - 4)
        // TODO workaround until buildings can be placed without terrain ray intersection
        GameState.buildings.forEach((b) => b.group.position.y = this.terrain.worldMgr.getTerrainHeight(b.group.position.x, b.group.position.z))
    }

    private dropContainedOre(dropAmount: number) {
        for (let c = 0; c < dropAmount && this.containedOres > 0; c++) {
            this.containedOres--
            const x = this.x * TILESIZE + TILESIZE / 2 + getRandomSign() * getRandom(TILESIZE / 4)
            const z = this.y * TILESIZE + TILESIZE / 2 + getRandomSign() * getRandom(TILESIZE / 4)
            this.terrain.worldMgr.addCollectable(new Ore(), x, z)
        }
    }

    cancelJobs() {
        const jobs = this.jobs // ensure consistency while processing
        this.jobs = []
        jobs.forEach((job) => EventBus.publishEvent(new JobDeleteEvent(job)))
        this.updateJobColor()
    }

    reduceRubble() {
        if (this.surfaceType === SurfaceType.RUBBLE4) this.surfaceType = SurfaceType.RUBBLE3
        else if (this.surfaceType === SurfaceType.RUBBLE3) this.surfaceType = SurfaceType.RUBBLE2
        else if (this.surfaceType === SurfaceType.RUBBLE2) this.surfaceType = SurfaceType.RUBBLE1
        else if (this.surfaceType === SurfaceType.RUBBLE1) this.surfaceType = SurfaceType.GROUND
        this.dropContainedOre(1)
        this.updateTexture()
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
            // TODO if wall was reinforced remove it (same for fallin)
        }

        this.updateTexture()
        this.updateJobColor()
    }

    cancelReinforceJobs() {
        const otherJobs = []
        this.jobs.forEach((job) => {
            if (job.workType === SurfaceJobType.REINFORCE) {
                EventBus.publishEvent(new JobDeleteEvent(job))
            } else {
                otherJobs.push(job)
            }
        })
        this.jobs = otherJobs
        this.updateJobColor()
    }

    updateTexture() {
        let textureName = this.terrain.textureSet.texturebasename
        if (!this.discovered) {
            textureName += '70'
        } else if (this.surfaceType === SurfaceType.POWER_PATH) {
            textureName += this.updatePowerPathTexture()
        } else if (!this.surfaceType.shaping) {
            textureName += this.surfaceType.matIndex.toString()
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

    updatePowerPathTexture(): string {
        this.surfaceRotation = 0
        const left = this.terrain.getSurface(this.x - 1, this.y).isPath()
        const top = this.terrain.getSurface(this.x, this.y - 1).isPath()
        const right = this.terrain.getSurface(this.x + 1, this.y).isPath()
        const bottom = this.terrain.getSurface(this.x, this.y + 1).isPath()
        const pathSum = (left ? 1 : 0) + (top ? 1 : 0) + (right ? 1 : 0) + (bottom ? 1 : 0)
        if (pathSum === 0 || pathSum === 1) {
            if (left) this.surfaceRotation = Math.PI / 2
            if (top) this.surfaceRotation = Math.PI
            if (right) this.surfaceRotation = -Math.PI / 2
            return '65'
        } else if (pathSum === 2) {
            if (left === right) {
                this.surfaceRotation = left ? Math.PI / 2 : 0
                return '62'
            } else {
                if (left && bottom) this.surfaceRotation = Math.PI / 2
                if (left && top) this.surfaceRotation = Math.PI
                if (top && right) this.surfaceRotation = -Math.PI / 2
                return '63'
            }
        } else if (pathSum === 3) {
            if (!top) this.surfaceRotation = Math.PI / 2
            if (!right) this.surfaceRotation = Math.PI
            if (!bottom) this.surfaceRotation = -Math.PI / 2
            return '64'
        } else {
            return '60'
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

        const geometry = SurfaceGeometry.create(this.wallType, topLeftVertex, bottomRightVertex, topRightVertex, bottomLeftVertex,
            topLeftVertex.y + avgHeight(surfTopLeft, surfTop, this, surfLeft) * HEIGHT_MULTIPLER,
            topRightVertex.y + avgHeight(surfTop, surfTopRight, surfRight, this) * HEIGHT_MULTIPLER,
            bottomRightVertex.y + avgHeight(this, surfRight, surfBottomRight, surfBottom) * HEIGHT_MULTIPLER,
            bottomLeftVertex.y + avgHeight(surfLeft, this, surfBottom, surfBottomLeft) * HEIGHT_MULTIPLER,
        )

        this.mesh = new Mesh(geometry, new MeshPhongMaterial({shininess: 0}))
        this.mesh.userData = {selectable: this}

        this.terrain.floorGroup.add(this.mesh)
        this.terrain.floorGroup.updateWorldMatrix(true, true) // otherwise ray intersection is not working before rendering
    }

    getSelectionType(): SelectionType {
        return SelectionType.SURFACE
    }

    select(): Selectable {
        if (this.surfaceType.selectable && (this.wallType !== WALL_TYPE.INVERTED_CORNER && this.wallType !== WALL_TYPE.WEIRD_CREVICE) && !this.selected) {
            this.selected = true
            this.accessMaterials().forEach((mat) => mat.color.setHex(0x6060a0))
            EventBus.publishEvent(new SurfaceSelectedEvent(this))
            return this
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
        let color = 0xffffff
        this.jobs.forEach((job) => color = job.workType.color) // TODO prioritize colors?
        this.accessMaterials().forEach((mat) => mat.color.setHex(color))
    }

    hasRubble(): boolean { // TODO performance: use boolean on surfacetype
        return this.surfaceType === SurfaceType.RUBBLE1
            || this.surfaceType === SurfaceType.RUBBLE2
            || this.surfaceType === SurfaceType.RUBBLE3
            || this.surfaceType === SurfaceType.RUBBLE4
    }

    isPath(): boolean {
        return this.surfaceType === SurfaceType.POWER_PATH || this.surfaceType === SurfaceType.POWER_PATH_BUILDING
    }

    isWalkable(): boolean {
        return this.surfaceType.floor && this.discovered && this.surfaceType !== SurfaceType.LAVA && this.surfaceType !== SurfaceType.WATER
    }

    isDrillable(): boolean {
        return this.surfaceType.drillable && this.discovered && (this.wallType === WALL_TYPE.WALL || this.wallType === WALL_TYPE.CORNER)
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

    getDigPositions(): Vector3[] {
        const digPosition = []
        if (this.terrain.getSurface(this.x - 1, this.y).isWalkable()) digPosition.push(new Vector3(this.x * TILESIZE - 1, 0, this.y * TILESIZE + TILESIZE / 2))
        if (this.terrain.getSurface(this.x, this.y - 1).isWalkable()) digPosition.push(new Vector3(this.x * TILESIZE + TILESIZE / 2, 0, this.y * TILESIZE - 1))
        if (this.terrain.getSurface(this.x + 1, this.y).isWalkable()) digPosition.push(new Vector3(this.x * TILESIZE + TILESIZE + 1, 0, this.y * TILESIZE + TILESIZE / 2))
        if (this.terrain.getSurface(this.x, this.y + 1).isWalkable()) digPosition.push(new Vector3(this.x * TILESIZE + TILESIZE / 2, 0, this.y * TILESIZE + TILESIZE + 1))
        return digPosition
    }

    reinforce() {
        this.reinforced = true
        this.cancelReinforceJobs()
        if (this.fallinTimeout) clearTimeout(this.fallinTimeout)
        this.updateTexture()
    }

    getCenterWorld(): Vector3 {
        const center = new Vector3(this.x * TILESIZE + TILESIZE / 2, 0, this.y * TILESIZE + TILESIZE / 2)
        center.y = this.terrain.worldMgr.getTerrainHeight(center.x, center.z)
        return center
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

        // FIXME refactor animation handling
        const content = ResourceManager.getResource('MiscAnims/RockFall/Rock3Sides.lws')
        const animation = new LWSCLoader('MiscAnims/RockFall/').parse(content)
        this.fallinGrp = new Group()
        this.fallinGrp.position.copy(fallinPosition)
        const dx = this.x - targetX, dy = targetY - this.y
        this.fallinGrp.rotateOnAxis(new Vector3(0, 1, 0), Math.atan2(dy, dx) + Math.PI / 2)
        this.terrain.worldMgr.sceneManager.scene.add(this.fallinGrp)
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

        const targetSurface = this.terrain.getSurface(targetX, targetY)
        targetSurface.surfaceType = SurfaceType.RUBBLE4
        targetSurface.updateTexture()
    }

    animate(poly, animation, frameIndex) { // FIXME refactor animation handling
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
                        mat.transparent = true
                        mat.alphaTest = 0
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
            this.terrain.worldMgr.sceneManager.scene.remove(this.fallinGrp)
            this.fallinGrp = null
        }
    }

    dispose() {
        this.mesh.geometry.dispose()
        this.accessMaterials().forEach(m => m.dispose())
    }

}

export enum WALL_TYPE {

    CORNER = 1,
    WALL = 2,
    INVERTED_CORNER = 3,
    WEIRD_CREVICE = 20,

}
