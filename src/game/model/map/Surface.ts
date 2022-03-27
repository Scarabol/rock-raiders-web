import { MathUtils, PositionalAudio, Raycaster, Vector2, Vector3 } from 'three'
import { Sample } from '../../../audio/Sample'
import { SoundManager } from '../../../audio/SoundManager'
import { EventBus } from '../../../event/EventBus'
import { SelectionChanged, UpdateRadarSurface, UpdateRadarTerrain } from '../../../event/LocalEvents'
import { CavernDiscovered, JobCreateEvent, JobDeleteEvent, OreFoundEvent } from '../../../event/WorldEvents'
import { CrystalFoundEvent } from '../../../event/WorldLocationEvent'
import { SURFACE_NUM_CONTAINED_ORE, SURFACE_NUM_SEAM_LEVELS, TILESIZE } from '../../../params'
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
import { SurfaceType } from './SurfaceType'
import { Terrain } from './Terrain'
import { SurfaceMesh } from './SurfaceMesh'
import { SurfaceVertex } from './SurfaceGeometry'
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
    discovered: boolean = false
    selected: boolean = false
    reinforced: boolean = false
    drillJob: DrillJob = null
    reinforceJob: ReinforceJob = null
    dynamiteJob: CarryDynamiteJob = null
    clearRubbleJob: ClearRubbleJob = null
    seamLevel: number = 0

    wallType: WALL_TYPE = null
    mesh: SurfaceMesh = null
    needsMeshUpdate: boolean = false

    rubblePositions: Vector2[] = []

    building: BuildingEntity = null
    pathBlockedByBuilding: boolean = false
    site: BuildingSite = null
    fence: ElectricFence = null
    fenceRequested: boolean = false
    energized: boolean = false

    constructor(terrain: Terrain, surfaceType: SurfaceType, x: number, y: number) {
        this.terrain = terrain
        this.sceneMgr = this.terrain.sceneMgr
        this.entityMgr = this.terrain.entityMgr
        this.surfaceType = surfaceType
        if (surfaceType === SurfaceType.CRYSTAL_SEAM || surfaceType === SurfaceType.ORE_SEAM) this.seamLevel = SURFACE_NUM_SEAM_LEVELS
        this.x = x
        this.y = y
        this.mesh = new SurfaceMesh(x, y, {selectable: this, surface: this})
        this.terrain.floorGroup.add(this.mesh)
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
            if (w.isUnstable()) w.collapse()
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
                .multiplyScalar(0.3 + Math.randomInclusive(3) / 10)
                .rotateAround(new Vector2(0, 0), degToRad(-10 + Math.randomInclusive(20)))
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
        this.containedOres += SURFACE_NUM_CONTAINED_ORE
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
                    if (surf.isUnstable()) surf.collapse()
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
        return new Vector2(this.x * TILESIZE + TILESIZE / 2 + Math.randomSign() * Math.randomInclusive(TILESIZE / 4),
            this.y * TILESIZE + TILESIZE / 2 + Math.randomSign() * Math.randomInclusive(TILESIZE / 4))
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

    isUnstable(): boolean {
        if (this.surfaceType.floor) return false
        const adjacent = this.terrain.getAdjacent(this.x, this.y)
        return [adjacent.left, adjacent.topLeft, adjacent.top].some((s) => s.isGround())
            && [adjacent.top, adjacent.topRight, adjacent.right].some((s) => s.isGround())
            && [adjacent.right, adjacent.bottomRight, adjacent.bottom].some((s) => s.isGround())
            && [adjacent.bottom, adjacent.bottomLeft, adjacent.left].some((s) => s.isGround())
    }

    private isGround(recursion: boolean = true): boolean {
        return this.discovered && this.surfaceType.floor && (!recursion || this.neighbors.some((n) => n.isGround(false)))
    }

    updateMesh(force: boolean = true) {
        if (!force && !this.needsMeshUpdate) return
        this.needsMeshUpdate = false
        const adjacent = this.terrain.getAdjacent(this.x, this.y)
        const topLeftVertex = this.getVertex(this.x, this.y, adjacent.left, adjacent.topLeft, adjacent.top)
        const topRightVertex = this.getVertex(this.x + 1, this.y, adjacent.top, adjacent.topRight, adjacent.right)
        const bottomRightVertex = this.getVertex(this.x + 1, this.y + 1, adjacent.right, adjacent.bottomRight, adjacent.bottom)
        const bottomLeftVertex = this.getVertex(this.x, this.y + 1, adjacent.bottom, adjacent.bottomLeft, adjacent.left)
        this.updateWallType(topLeftVertex, topRightVertex, bottomRightVertex, bottomLeftVertex)
        this.updateTexture()
        this.updateJobColor()
        this.terrain.pathFinder.updateSurface(this)
    }

    private getVertex(x: number, y: number, s1: Surface, s2: Surface, s3: Surface): SurfaceVertex {
        const high = (!this.discovered || (!this.surfaceType.floor || !this.neighbors.some((s) => s.isGround())) && ![s1, s2, s3].some((s) => s.isGround()))
        const offset = this.terrain.heightOffset[x][y]
        return new SurfaceVertex(high, offset)
    }

    private updateWallType(topLeft: SurfaceVertex, topRight: SurfaceVertex, bottomRight: SurfaceVertex, bottomLeft: SurfaceVertex) {
        let wallType = topLeft.highNum + topRight.highNum + bottomRight.highNum + bottomLeft.highNum
        if (wallType === WALL_TYPE.WALL && topLeft.highNum === bottomRight.highNum) wallType = WALL_TYPE.WEIRD_CREVICE
        if (this.wallType === wallType) return
        this.wallType = wallType
        this.mesh.setHeights(wallType, topLeft, topRight, bottomRight, bottomLeft)
        if (this.wallType !== WALL_TYPE.WALL) this.cancelReinforceJobs()
    }

    cancelReinforceJobs() {
        this.reinforceJob = Surface.safeRemoveJob(this.reinforceJob)
        this.updateJobColor()
    }

    updateTexture() {
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
        const textureFilepath = this.terrain.textureSet.textureBasename + suffix + '.bmp'
        this.mesh.setTexture(textureFilepath, rotation)
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

    isSelectable(): boolean {
        return (this.surfaceType.selectable || !!this.site) && (this.wallType !== WALL_TYPE.INVERTED_CORNER && this.wallType !== WALL_TYPE.WEIRD_CREVICE) && !this.selected && this.discovered
    }

    isInSelection(): boolean {
        return this.isSelectable() || this.selected
    }

    select(): boolean {
        if (!this.isSelectable()) return false
        this.selected = true
        this.mesh.setHighlightColor(0x6060a0)
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
        this.mesh.setHighlightColor(color)
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
        this.mesh?.dispose()
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
