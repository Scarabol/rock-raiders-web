import { MathUtils, Mesh, MeshPhongMaterial, PositionalAudio, Raycaster, Vector2, Vector3 } from 'three'
import { Sample } from '../../../audio/Sample'
import { SoundManager } from '../../../audio/SoundManager'
import { asArray, getRandom, getRandomSign } from '../../../core/Util'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged, UpdateRadarSurface, UpdateRadarTerrain } from '../../../event/LocalEvents'
import { CavernDiscovered, JobCreateEvent, JobDeleteEvent, OreFoundEvent } from '../../../event/WorldEvents'
import { CrystalFoundEvent } from '../../../event/WorldLocationEvent'
import { HEIGHT_MULTIPLIER, TILESIZE } from '../../../params'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { BuildingEntity } from '../building/BuildingEntity'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { CarryDynamiteJob } from '../job/carry/CarryDynamiteJob'
import { ClearRubbleJob } from '../job/surface/ClearRubbleJob'
import { DrillJob } from '../job/surface/DrillJob'
import { ReinforceJob } from '../job/surface/ReinforceJob'
import { Crystal } from '../material/Crystal'
import { Dynamite } from '../material/Dynamite'
import { ElectricFence } from '../material/ElectricFence'
import { Ore } from '../material/Ore'
import { Selectable } from '../Selectable'
import { SurfaceGeometry } from './SurfaceGeometry'
import { SurfaceType } from './SurfaceType'
import { Terrain } from './Terrain'
import { WALL_TYPE } from './WallType'
import degToRad = MathUtils.degToRad

export class Surface implements Selectable {
    terrain: Terrain
    sceneMgr: SceneManager
    entityMgr: EntityManager
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
    seamLevel: number = 0

    wallType: WALL_TYPE = null
    mesh: Mesh = null
    needsMeshUpdate: boolean = false

    topLeftVertex: Vector3 = null
    topRightVertex: Vector3 = null
    bottomRightVertex: Vector3 = null
    bottomLeftVertex: Vector3 = null
    topLeftHeightOffset: number = null
    topRightHeightOffset: number = null
    bottomRightHeightOffset: number = null
    bottomLeftHeightOffset: number = null

    rubblePositions: Vector2[] = []

    building: BuildingEntity = null
    pathBlockedByBuilding: boolean = false
    site: BuildingSite = null
    fence: ElectricFence = null
    fenceRequested: boolean = false
    energized: boolean = false

    constructor(terrain: Terrain, surfaceType: SurfaceType, x: number, y: number, heightOffset: number) {
        this.terrain = terrain
        this.sceneMgr = this.terrain.sceneMgr
        this.entityMgr = this.terrain.entityMgr
        this.surfaceType = surfaceType
        if (surfaceType === SurfaceType.CRYSTAL_SEAM || surfaceType === SurfaceType.ORE_SEAM) this.seamLevel = 4
        this.x = x
        this.y = y
        this.heightOffset = heightOffset
        if (surfaceType === SurfaceType.RUBBLE4 || surfaceType === SurfaceType.RUBBLE3 || surfaceType === SurfaceType.RUBBLE2 || surfaceType === SurfaceType.RUBBLE1) {
            this.rubblePositions = [this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition()]
        }
    }

    /**
     * @return {boolean} Returns true, if a new cave has been discovered
     */
    discover(): boolean {
        const walls: Map<string, Surface> = new Map()
        const touched: Map<string, Surface> = new Map()
        const caveFound = this.discoverNeighbors(true, walls, touched)
        walls.forEach((w) => w.markDiscovered())
        touched.forEach((w) => {
            w.needsMeshUpdate = true
            if (!w.isSupported()) w.collapse()
        })
        EventBus.publishEvent(new UpdateRadarTerrain(this.terrain, null))
        return caveFound
    }

    private discoverNeighbors(first: boolean, walls: Map<string, Surface>, touched: Map<string, Surface>): boolean {
        this.markDiscovered()
        let caveFound = false
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x === 0 && y === 0) continue
                const neighbor = this.terrain.getSurface(this.x + x, this.y + y)
                touched.set(`${neighbor.x}#${neighbor.y}`, neighbor)
                if (neighbor.discovered && !first) continue
                if ((x === 0 || y === 0) && neighbor.surfaceType.floor) {
                    caveFound = caveFound || !neighbor.discovered
                    const neighborCaveFound = neighbor.discoverNeighbors(false, walls, touched) // XXX refactor this remove recursion
                    caveFound = caveFound || neighborCaveFound
                } else {
                    walls.set(`${neighbor.x}#${neighbor.y}`, neighbor)
                }
            }
        }
        return caveFound
    }

    private markDiscovered() {
        if (this.discovered) return
        this.entityMgr.discoverSurface(this)
        this.discovered = true
        this.needsMeshUpdate = true
    }

    onDrillComplete(drillPosition: Vector2): boolean {
        if (this.seamLevel > 0) {
            this.seamLevel--
            const vec = new Vector2().copy(drillPosition).sub(this.getCenterWorld2D())
                .multiplyScalar(0.3 + getRandom(3) / 10)
                .rotateAround(new Vector2(0, 0), degToRad(-10 + getRandom(20)))
                .add(drillPosition)
            if (this.surfaceType === SurfaceType.CRYSTAL_SEAM) {
                const crystal = this.entityMgr.placeMaterial(new Crystal(this.sceneMgr, this.entityMgr), vec)
                EventBus.publishEvent(new CrystalFoundEvent(crystal.sceneEntity.position.clone()))
            } else if (this.surfaceType === SurfaceType.ORE_SEAM) {
                this.entityMgr.placeMaterial(new Ore(this.sceneMgr, this.entityMgr), vec)
                EventBus.publishEvent(new OreFoundEvent())
            }
        }
        if (this.seamLevel > 0) {
            return false
        } else {
            this.collapse()
            return true
        }
    }

    collapse() {
        if (this.surfaceType.floor) {
            console.log('Cannot collapse floor type surface')
            return
        }
        this.cancelJobs()
        this.terrain.removeFallInOrigin(this)
        const droppedOre = this.containedOres + (this.surfaceType === SurfaceType.ORE_SEAM ? this.seamLevel : 0)
        const droppedCrystals = this.containedCrystals + (this.surfaceType === SurfaceType.CRYSTAL_SEAM ? this.seamLevel : 0)
        this.setSurfaceType(SurfaceType.RUBBLE4)
        this.rubblePositions = [this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition()]
        this.containedOres += 4
        this.needsMeshUpdate = true
        const caveFound = this.discover()
        if (caveFound) EventBus.publishEvent(new CavernDiscovered())
        // drop contained ores and crystals
        this.dropContainedMaterials(droppedOre, droppedCrystals)
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
        this.playPositionalSample(Sample.SFX_RockBreak)
    }

    private dropContainedMaterials(droppedOre: number, droppedCrystals: number) {
        for (let c = 0; c < droppedOre && this.containedOres > 0; c++) {
            this.containedOres--
            this.entityMgr.placeMaterial(new Ore(this.sceneMgr, this.entityMgr), this.getRandomPosition())
            EventBus.publishEvent(new OreFoundEvent())
        }
        for (let c = 0; c < droppedCrystals; c++) {
            const crystal = this.entityMgr.placeMaterial(new Crystal(this.sceneMgr, this.entityMgr), this.getRandomPosition())
            EventBus.publishEvent(new CrystalFoundEvent(crystal.sceneEntity.position.clone()))
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

    private static safeRemoveJob(job: DrillJob | ReinforceJob | CarryDynamiteJob | ClearRubbleJob): null {
        if (job) EventBus.publishEvent(new JobDeleteEvent(job))
        return null
    }

    reduceRubble() {
        this.rubblePositions.shift()
        switch (this.surfaceType) {
            case SurfaceType.RUBBLE4:
                this.setSurfaceType(SurfaceType.RUBBLE3)
                break
            case SurfaceType.RUBBLE3:
                this.setSurfaceType(SurfaceType.RUBBLE2)
                break
            case SurfaceType.RUBBLE2:
                this.setSurfaceType(SurfaceType.RUBBLE1)
                break
            case SurfaceType.RUBBLE1:
                this.setSurfaceType(SurfaceType.GROUND)
                break
        }
        this.dropContainedMaterials(this.containedOres - this.rubblePositions.length, 0)
        if (this.selected) EventBus.publishEvent(new SelectionChanged(this.entityMgr))
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

        const surfLeft = this.terrain.getSurface(this.x - 1, this.y)
        const surfTopLeft = this.terrain.getSurface(this.x - 1, this.y - 1)
        const surfTop = this.terrain.getSurface(this.x, this.y - 1)
        const surfTopRight = this.terrain.getSurface(this.x + 1, this.y - 1)
        const surfRight = this.terrain.getSurface(this.x + 1, this.y)
        const surfBottomRight = this.terrain.getSurface(this.x + 1, this.y + 1)
        const surfBottom = this.terrain.getSurface(this.x, this.y + 1)
        const surfBottomLeft = this.terrain.getSurface(this.x - 1, this.y + 1)

        function isHighGround(surf0: Surface, surf1: Surface, surf2: Surface, surf3: Surface) {
            return !surf0.discovered || (
                (!surf0.surfaceType.floor || !surf0.neighbors.some((n) => n.surfaceType.floor && n.discovered)) &&
                (!surf1.discovered || !surf2.discovered || !surf3.discovered || (!surf1.surfaceType.floor && !surf2.surfaceType.floor && !surf3.surfaceType.floor))
            )
        }

        const topLeftVertex = new Vector3(0, 0)
        const topRightVertex = new Vector3(1, 0, 0)
        const bottomRightVertex = new Vector3(1, 0, 1)
        const bottomLeftVertex = new Vector3(0, 0, 1)

        if (isHighGround(this, surfLeft, surfTopLeft, surfTop)) topLeftVertex.y = 1
        if (isHighGround(this, surfTop, surfTopRight, surfRight)) topRightVertex.y = 1
        if (isHighGround(this, surfRight, surfBottomRight, surfBottom)) bottomRightVertex.y = 1
        if (isHighGround(this, surfBottom, surfBottomLeft, surfLeft)) bottomLeftVertex.y = 1

        // update mesh (geometry), if wall type changed
        let wallType = topLeftVertex.y + topRightVertex.y + bottomRightVertex.y + bottomLeftVertex.y
        if (wallType === WALL_TYPE.WALL && topLeftVertex.y === bottomRightVertex.y) wallType = WALL_TYPE.WEIRD_CREVICE

        if (this.wallType !== wallType) {
            this.wallType = wallType

            function avgHeight(...args: Surface[]) {
                return args.map((s) => s.heightOffset)
                    .reduce((l, r) => (l || 0) + (r || 0), 0) / (args.length || 1)
            }

            this.topLeftVertex = topLeftVertex.clone()
            this.topRightVertex = topRightVertex.clone()
            this.bottomRightVertex = bottomRightVertex.clone()
            this.bottomLeftVertex = bottomLeftVertex.clone()
            this.topLeftHeightOffset = avgHeight(surfTopLeft, surfTop, this, surfLeft) * HEIGHT_MULTIPLIER
            this.topRightHeightOffset = avgHeight(surfTop, surfTopRight, surfRight, this) * HEIGHT_MULTIPLIER
            this.bottomRightHeightOffset = avgHeight(this, surfRight, surfBottomRight, surfBottom) * HEIGHT_MULTIPLIER
            this.bottomLeftHeightOffset = avgHeight(surfLeft, this, surfBottom, surfBottomLeft) * HEIGHT_MULTIPLIER
            this.topLeftVertex.y += this.topLeftHeightOffset
            this.topRightVertex.y += this.topRightHeightOffset
            this.bottomRightVertex.y += this.bottomRightHeightOffset
            this.bottomLeftVertex.y += this.bottomLeftHeightOffset

            this.updateGeometry(topLeftVertex, topRightVertex, bottomRightVertex, bottomLeftVertex)
            if (this.wallType !== WALL_TYPE.WALL) this.cancelReinforceJobs()
        }

        this.updateTexture()
        this.updateJobColor()
        this.terrain.pathFinder.updateSurface(this)
    }

    cancelReinforceJobs() {
        this.reinforceJob = Surface.safeRemoveJob(this.reinforceJob)
        this.updateJobColor()
    }

    updateTexture() {
        this.forEachMaterial((mat) => mat.map?.dispose())
        let {textureNameSuffix, textureRotation} = this.determineTextureNameSuffixAndRotation()
        const texture = ResourceManager.getTexture(this.terrain.textureSet.textureBasename + textureNameSuffix + '.bmp')
        texture.center.set(0.5, 0.5)
        texture.rotation = textureRotation
        this.forEachMaterial((mat) => mat.map = texture)
    }

    private determineTextureNameSuffixAndRotation(): { textureNameSuffix: string, textureRotation: number } {
        let suffix = '', rotation = 0
        if (!this.discovered) {
            suffix = '70'
        } else if (this.surfaceType === SurfaceType.POWER_PATH) {
            const powerPath = this.determinePowerPathTextureNameSuffixAndRotation(rotation, suffix)
            rotation = powerPath.rotation
            suffix = powerPath.suffix
        } else if (!this.surfaceType.shaping && this.neighbors.some((n) => n.discovered && n.surfaceType.floor)) {
            if (this.surfaceType === SurfaceType.POWER_PATH_BUILDING && this.energized && this.building) {
                suffix = '66'
            } else {
                suffix = this.surfaceType.matIndex
            }
        } else if (this.wallType === WALL_TYPE.WEIRD_CREVICE) {
            suffix = '77'
        } else {
            if (this.wallType === WALL_TYPE.CORNER) {
                suffix += '5'
            } else if (this.wallType === WALL_TYPE.INVERTED_CORNER) {
                suffix += '3'
            } else if (this.reinforced) {
                suffix += '2'
            } else {
                suffix += '0'
            }
            suffix += this.surfaceType.shaping ? this.surfaceType.matIndex : SurfaceType.SOLID_ROCK.matIndex
        }
        return {textureNameSuffix: suffix, textureRotation: rotation}
    }

    private determinePowerPathTextureNameSuffixAndRotation(rotation: number, suffix: string) {
        const left = this.terrain.getSurface(this.x - 1, this.y).isPath()
        const top = this.terrain.getSurface(this.x, this.y - 1).isPath()
        const right = this.terrain.getSurface(this.x + 1, this.y).isPath()
        const bottom = this.terrain.getSurface(this.x, this.y + 1).isPath()
        const pathSum = (left ? 1 : 0) + (top ? 1 : 0) + (right ? 1 : 0) + (bottom ? 1 : 0)
        if (pathSum === 0 || pathSum === 1) {
            if (left) rotation = -Math.PI / 2
            else if (top) rotation = Math.PI
            else if (right) rotation = Math.PI / 2
            suffix = this.energized ? '75' : '65'
        } else if (pathSum === 2) {
            if (left === right) {
                rotation = left ? Math.PI / 2 : 0
                suffix = this.energized ? '72' : '62'
            } else {
                if (left && bottom) rotation = -Math.PI / 2
                else if (left && top) rotation = Math.PI
                else if (top && right) rotation = Math.PI / 2
                suffix = this.energized ? '73' : '63'
            }
        } else if (pathSum === 3) {
            if (!top) rotation = -Math.PI / 2
            else if (!right) rotation = Math.PI
            else if (!bottom) rotation = Math.PI / 2
            suffix = this.energized ? '74' : '64'
        } else {
            suffix = this.energized ? '71' : '60'
        }
        return {rotation, suffix}
    }

    setEnergized(state: boolean) {
        this.energized = state
        this.updateTexture()
        this.building?.updateEnergyState()
    }

    forEachMaterial(callback: (mat: MeshPhongMaterial) => void): void {
        asArray(this.mesh?.material).forEach((m) => callback(m as MeshPhongMaterial))
    }

    updateGeometry(topLeftVertex: Vector3, topRightVertex: Vector3, bottomRightVertex: Vector3, bottomLeftVertex: Vector3) {
        if (this.mesh) this.terrain.floorGroup.remove(this.mesh)
        this.mesh?.geometry?.dispose()
        this.forEachMaterial((m) => m.dispose())

        const geometry = SurfaceGeometry.create(this.wallType, topLeftVertex, topRightVertex, bottomRightVertex, bottomLeftVertex,
            this.topLeftVertex.y, this.topRightVertex.y, this.bottomRightVertex.y, this.bottomLeftVertex.y)

        this.mesh = new Mesh(geometry, new MeshPhongMaterial({shininess: 0}))
        this.mesh.position.set(this.x, 0, this.y)
        this.mesh.userData = {selectable: this, surface: this}

        this.terrain.floorGroup.add(this.mesh)
    }

    isSelectable(): boolean {
        return (this.surfaceType.selectable || !!this.site) && (this.wallType !== WALL_TYPE.INVERTED_CORNER && this.wallType !== WALL_TYPE.WEIRD_CREVICE) && !this.selected && this.discovered
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.selected = true
        this.forEachMaterial((mat) => mat.color.setHex(0x6060a0))
        if (this.surfaceType.floor) SoundManager.playSample(Sample.SFX_Floor)
        if (this.surfaceType.shaping) SoundManager.playSample(Sample.SFX_Wall)
        console.log(`Surface selected at ${this.x}/${this.y}`)
        return true
    }

    deselect(): any {
        if (!this.selected) return
        this.selected = false
        this.updateJobColor()
    }

    updateJobColor() {
        if (this.selected) return
        const color = this.dynamiteJob?.color || this.reinforceJob?.color || this.drillJob?.color || 0xffffff
        this.forEachMaterial((mat) => mat.color.setHex(color))
    }

    hasRubble(): boolean {
        return this.rubblePositions.length > 0
    }

    isPath(): boolean {
        return this.surfaceType === SurfaceType.POWER_PATH || (this.surfaceType === SurfaceType.POWER_PATH_BUILDING && !!this.building)
    }

    isWalkable(): boolean {
        return this.surfaceType.floor && this.discovered && this.surfaceType !== SurfaceType.LAVA && this.surfaceType !== SurfaceType.WATER && !this.pathBlockedByBuilding
    }

    isDigable(): boolean {
        return this.surfaceType.digable && this.discovered && (this.wallType === WALL_TYPE.WALL || this.wallType === WALL_TYPE.CORNER)
    }

    isReinforcable(): boolean {
        return this.surfaceType.reinforcable && this.discovered && this.wallType === WALL_TYPE.WALL && !this.reinforced
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
        this.terrain.removeFallInOrigin(this)
        this.updateTexture()
        EventBus.publishEvent(new UpdateRadarSurface(this))
    }

    getCenterWorld2D(): Vector2 {
        return new Vector2(this.x, this.y).addScalar(0.5).multiplyScalar(TILESIZE)
    }

    getCenterWorld(): Vector3 {
        const center = this.getCenterWorld2D()
        const raycaster = new Raycaster(new Vector3(center.x, 3 * TILESIZE, center.y), new Vector3(0, -1, 0))
        const intersect = raycaster.intersectObject(this.mesh, true)
        if (intersect.length < 1) console.warn(`could not determine terrain height for ${center.x}/${center.y}`)
        const terrainHeight = intersect[0]?.point?.y || 0
        return new Vector3(center.x, terrainHeight, center.y)
    }

    disposeFromWorld() {
        this.forEachMaterial(m => m.dispose())
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
        if (this.surfaceType.rubbleResilient) return
        this.rubblePositions = [this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition()]
        this.containedOres += containedOre
        this.setSurfaceType(SurfaceType.RUBBLE4)
    }

    setBuilding(building: BuildingEntity) {
        this.building = building
        this.terrain.pathFinder.updateSurface(this)
        this.setSurfaceType(this.building ? SurfaceType.POWER_PATH_BUILDING : SurfaceType.GROUND)
    }

    setSurfaceType(surfaceType: SurfaceType) {
        if (surfaceType === this.surfaceType) return
        const oldSurfaceType = this.surfaceType
        const wasPath = this.surfaceType === SurfaceType.POWER_PATH || this.surfaceType === SurfaceType.POWER_PATH_BUILDING
        this.surfaceType = surfaceType
        this.updateTexture()
        if (oldSurfaceType.connectsPath || this.surfaceType.connectsPath) this.neighbors.forEach((n) => n.updateTexture())
        EventBus.publishEvent(new UpdateRadarSurface(this))
        if (wasPath !== this.isPath()) this.terrain.powerGrid.onPathChange(this)
    }

    canPlaceFence(): boolean {
        return this.surfaceType.canHaveFence && !this.building && !this.fence && !this.fenceRequested &&
            [1, 2].some((n) => {
                return this.terrain.getSurface(this.x - n, this.y).fencePowerSupplier || this.terrain.getSurface(this.x, this.y - n).fencePowerSupplier
                    || this.terrain.getSurface(this.x + n, this.y).fencePowerSupplier || this.terrain.getSurface(this.x, this.y + n).fencePowerSupplier
            })
    }

    get fencePowerSupplier(): boolean {
        return !!this.fence || (this === this.building?.primarySurface || this === this.building?.secondarySurface)
    }

    createDrillJob(): DrillJob {
        if (!this.isDigable()) return null
        if (!this.drillJob) {
            this.drillJob = new DrillJob(this)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.drillJob))
        }
        return this.drillJob
    }

    createReinforceJob(): ReinforceJob {
        if (!this.isReinforcable()) return null
        if (!this.reinforceJob) {
            this.reinforceJob = new ReinforceJob(this)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.reinforceJob))
        }
        return this.reinforceJob
    }

    createDynamiteJob(): CarryDynamiteJob {
        if (!this.isDigable()) return null
        if (!this.dynamiteJob) {
            const targetBuilding = this.entityMgr.getClosestBuildingByType(this.getCenterWorld(), EntityType.TOOLSTATION) // XXX performance cache this
            if (!targetBuilding) throw new Error('Could not find toolstation to spawn dynamite')
            const dynamite = new Dynamite(this.sceneMgr, this.entityMgr, this)
            dynamite.sceneEntity.addToScene(targetBuilding.getDropPosition2D(), targetBuilding.sceneEntity.getHeading())
            this.dynamiteJob = new CarryDynamiteJob(dynamite)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.dynamiteJob))
        }
        return this.dynamiteJob
    }

    createClearRubbleJob(): ClearRubbleJob {
        if (!this.hasRubble()) return null
        if (!this.clearRubbleJob) {
            this.clearRubbleJob = new ClearRubbleJob(this)
            this.updateJobColor()
            EventBus.publishEvent(new JobCreateEvent(this.clearRubbleJob))
        }
        return this.clearRubbleJob
    }

    playPositionalSample(sample: Sample): PositionalAudio { // TODO merge with AnimEntity code (at least in SceneEntity maybe)
        const audio = new PositionalAudio(this.sceneMgr.listener)
        audio.setRefDistance(TILESIZE * 6)
        audio.position.setScalar(0.5)
        this.mesh.add(audio)
        SoundManager.getSoundBuffer(Sample[sample]).then((audioBuffer) => {
            audio.setBuffer(audioBuffer)
            audio.play()
        })
        return audio
    }

    isBlockedByVehicle() {
        return this.entityMgr.vehicles.some((v) => v.sceneEntity.surfaces.includes(this))
    }

    isBlockedByRaider() {
        return this.entityMgr.raiders.some((r) => r.sceneEntity.surfaces.includes(this))
    }

    isBlocked(): boolean {
        return this.isBlockedByRaider() || this.isBlockedByVehicle()
    }
}
