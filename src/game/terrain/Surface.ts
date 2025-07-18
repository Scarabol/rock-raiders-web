import { Raycaster, Vector2, Vector3 } from 'three'
import { SoundManager } from '../../audio/SoundManager'
import { DeselectAll, SelectionChanged, UpdateRadarSurface, UpdateRadarTerrain } from '../../event/LocalEvents'
import { CavernDiscovered, JobCreateEvent, OreFoundEvent, WorldLocationEvent } from '../../event/WorldEvents'
import { EventKey } from '../../event/EventKeyEnum'
import { DEV_MODE, SURFACE_NUM_CONTAINED_ORE, SURFACE_NUM_SEAM_LEVELS, TILESIZE } from '../../params'
import { WorldManager } from '../WorldManager'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { BuildingSite } from '../model/building/BuildingSite'
import { EntityType } from '../model/EntityType'
import { ClearRubbleJob } from '../model/job/surface/ClearRubbleJob'
import { DrillJob } from '../model/job/surface/DrillJob'
import { ReinforceJob } from '../model/job/surface/ReinforceJob'
import { GameEntity } from '../ECS'
import { SurfaceVertex } from './SurfaceGeometry'
import { SurfaceMesh } from './SurfaceMesh'
import { SurfaceType } from './SurfaceType'
import { Terrain } from './Terrain'
import { WALL_TYPE } from './WallType'
import { Job } from '../model/job/Job'
import { JobState } from '../model/job/JobState'
import { MaterialSpawner } from '../factory/MaterialSpawner'
import { degToRad } from 'three/src/math/MathUtils'
import { PositionComponent } from '../component/PositionComponent'
import { AnimationGroup } from '../../scene/AnimationGroup'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { TooltipComponent } from '../component/TooltipComponent'
import { EmergeComponent } from '../component/EmergeComponent'
import { FallInComponent } from '../component/FallInComponent'
import { FluidSurfaceComponent } from '../component/FluidSurfaceComponent'
import { MonsterSpawner } from '../factory/MonsterSpawner'
import { PRNG } from '../factory/PRNG'

export class Surface {
    readonly worldMgr: WorldManager
    readonly entity: GameEntity
    containedOres: number = 0
    containedCrystals: number = 0
    discovered: boolean = false
    scanned: boolean = false
    selected: boolean = false
    reinforced: boolean = false
    drillJob?: DrillJob
    reinforceJob?: ReinforceJob
    dynamiteJob?: Job
    clearRubbleJob?: ClearRubbleJob
    seamLevel: number = 0
    drillProgress: number = 0

    readonly mesh: SurfaceMesh
    readonly roofMesh: SurfaceMesh
    wallType: WALL_TYPE = WALL_TYPE.FLOOR
    needsMeshUpdate: boolean = false

    rubblePositions: Vector2[] = []

    building?: BuildingEntity
    pathBlockedByBuilding: boolean = false
    site?: BuildingSite
    fence?: GameEntity
    stud?: AnimationGroup
    fenceRequested: boolean = false
    energized: boolean = false

    constructor(readonly terrain: Terrain, public surfaceType: SurfaceType, readonly x: number, readonly y: number) {
        this.worldMgr = this.terrain.worldMgr
        this.entity = this.worldMgr.ecs.addEntity()
        this.updateObjectName()
        switch (surfaceType) {
            case SurfaceType.CRYSTAL_SEAM:
            case SurfaceType.ORE_SEAM:
                this.seamLevel = SURFACE_NUM_SEAM_LEVELS
                break
            case SurfaceType.RUBBLE4:
            case SurfaceType.RUBBLE3:
            case SurfaceType.RUBBLE2:
            case SurfaceType.RUBBLE1:
                this.rubblePositions = [this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition()]
                break
        }
        // TODO Use pro meshes for high wall details in FPV
        // const proMesh = ResourceManager.getLwoModel(this.terrain.textureSet.meshBasename + '01b.lwo')
        // proMesh.position.copy(this.mesh.position)
        // proMesh.scale.setScalar(1 / TILESIZE)
        // this.terrain.floorGroup.add(proMesh)
        this.mesh = new SurfaceMesh(x, y, {selectable: this, surface: this})
        this.roofMesh = new SurfaceMesh(x, y, {})
        this.roofMesh.position.y = 3
        this.roofMesh.scale.y *= -1 // flip mesh upside down
    }

    private updateObjectName() {
        const objectName = this.surfaceType.getObjectName()
        if (objectName) {
            const tooltipComponent = this.worldMgr.ecs.getComponents(this.entity).get(TooltipComponent)
            if (tooltipComponent) {
                tooltipComponent.tooltipText = objectName
                tooltipComponent.sfxKey = this.surfaceType.getSfxKey()
            } else {
                this.worldMgr.ecs.addComponent(this.entity, new TooltipComponent(this.entity, objectName, this.surfaceType.getSfxKey()))
            }
        } else {
            this.worldMgr.ecs.removeComponent(this.entity, TooltipComponent)
        }
    }

    /**
     * @return {boolean} Returns true, if a new cave has been discovered
     */
    discover(): boolean {
        const walls: Map<string, Surface> = new Map()
        let caveFound = false
        for (let surface: Surface = this, stack: Surface[] = []; surface; surface = stack.pop()) {
            surface.markDiscovered()
            for (const neighbor of surface.neighbors8) {
                if (neighbor.surfaceType.floor || neighbor.surfaceType === SurfaceType.HIDDEN_CAVERN || neighbor.surfaceType === SurfaceType.HIDDEN_SLUG_HOLE) {
                    if (!neighbor.discovered || neighbor.surfaceType === SurfaceType.HIDDEN_CAVERN || neighbor.surfaceType === SurfaceType.HIDDEN_SLUG_HOLE) {
                        stack.push(neighbor)
                        caveFound = true
                    }
                } else {
                    walls.set(`${neighbor.x}#${neighbor.y}`, neighbor)
                }
            }
        }
        walls.forEach((w) => {
            w.markDiscovered()
            w.needsMeshUpdate = true
        })
        walls.forEach((w) => w.isUnstable() && w.collapse())
        EventBroker.publish(new UpdateRadarTerrain(this.terrain))
        return caveFound
    }

    private markDiscovered() {
        if (this.neighbors8.some((n) => n.discovered && n.surfaceType.floor)) {
            switch (this.surfaceType) {
                case SurfaceType.LAVA5:
                // fallthrough
                case SurfaceType.WATER:
                    this.worldMgr.ecs.addComponent(this.entity, new FluidSurfaceComponent(this.x, this.y, this.mesh.geometry.attributes.uv))
                    break
                case SurfaceType.HIDDEN_CAVERN:
                    this.surfaceType = SurfaceType.GROUND
                    this.needsMeshUpdate = true
                    this.updateObjectName()
                    break
                case SurfaceType.HIDDEN_SLUG_HOLE:
                    this.surfaceType = SurfaceType.SLUG_HOLE
                    this.terrain.slugHoles.add(this)
                    this.needsMeshUpdate = true
                    this.updateObjectName()
                    break
                case SurfaceType.RECHARGE_SEAM:
                    this.terrain.rechargeSeams.add(this)
                    const floorNeighbor = this.neighbors.find((n) => n.surfaceType.floor)
                    if (floorNeighbor) { // TODO Same code as in terrain loader class
                        const position = new Vector3(0.5, this.terrain.getHeightOffset(this.x, this.y), 0.5)
                        const angle = Math.atan2(floorNeighbor.y - this.y, this.x - floorNeighbor.x) + Math.PI / 2
                        const grp = this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.rechargeSparkle, position, angle, true)
                        grp.scale.setScalar(1 / TILESIZE)
                        this.mesh.add(grp)
                    } else {
                        console.warn('Could not add sparkles to recharge seam, because of missing floor neighbor')
                    }
                    break
            }
        }
        if (this.discovered) return
        this.discovered = true
        this.worldMgr.entityMgr.discoverSurface(this)
        this.needsMeshUpdate = true
    }

    addDrillTimeProgress(drillTimeSeconds: number, elapsedMs: number, drillPosition: Vector2) {
        if (this.drillProgress >= 1 || drillTimeSeconds <= 0) return
        const drillProgress = elapsedMs / (drillTimeSeconds * 1000)
        this.addDrillProgress(drillProgress, drillPosition)
    }

    addDrillProgress(drillProgress: number, drillPosition: Vector2) {
        this.drillProgress += drillProgress
        if (this.drillProgress >= 1) {
            this.onDrillComplete(drillPosition)
        }
    }

    onDrillComplete(drillPosition: Vector2): boolean {
        this.drillProgress = 0
        if (this.seamLevel > 0) {
            this.seamLevel--
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    this.terrain.getSurface(this.x + x, this.y + y).updateMesh(true)
                }
            }
            const seamDropPosition = new Vector2().copy(drillPosition).sub(this.getCenterWorld2D())
                .clampLength(TILESIZE / 10, TILESIZE / 10 + PRNG.terrain.randInt(TILESIZE / 2 - TILESIZE / 10))
                .rotateAround(new Vector2(0, 0), degToRad(-10 + PRNG.terrain.randInt(20)))
                .add(drillPosition)
            if (this.surfaceType === SurfaceType.CRYSTAL_SEAM) {
                const crystal = MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.CRYSTAL, seamDropPosition)
                EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_CRYSTAL_FOUND, this.worldMgr.ecs.getComponents(crystal.entity).get(PositionComponent)))
            } else if (this.surfaceType === SurfaceType.ORE_SEAM) {
                MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.ORE, seamDropPosition)
                EventBroker.publish(new OreFoundEvent())
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
        this.worldMgr.ecs.removeComponent(this.entity, FallInComponent)
        this.reinforced = false
        const droppedOre = this.containedOres + (this.surfaceType === SurfaceType.ORE_SEAM ? this.seamLevel : 0)
        const droppedCrystals = this.containedCrystals + (this.surfaceType === SurfaceType.CRYSTAL_SEAM ? this.seamLevel : 0)
        this.setSurfaceType(SurfaceType.RUBBLE4)
        this.containedOres += SURFACE_NUM_CONTAINED_ORE
        this.needsMeshUpdate = true
        const caveFound = this.discover()
        if (caveFound) EventBroker.publish(new CavernDiscovered())
        if (this.selected) EventBroker.publish(new DeselectAll())
        // drop contained ores and crystals
        this.dropContainedMaterials(droppedOre, droppedCrystals)
        // add crumble animation
        const wallNeighbors = this.neighbors.filter((n) => !!n.wallType)
        const randomWallNeighbor = PRNG.terrain.sample(wallNeighbors)
        if (this.wallType === WALL_TYPE.CORNER && randomWallNeighbor) { // by default the corner animation goes from this.x+1,this.y+1 to this.x,this.y
            const neighborToRight = this.terrain.getSurface(this.x - randomWallNeighbor.y + this.y, this.y + randomWallNeighbor.x - this.x)
            let crumbleAngle = Math.atan2(neighborToRight.x - this.x, neighborToRight.y - this.y)
            if (!neighborToRight.wallType) crumbleAngle += Math.PI / 2
            const rockFallAnimName = this.terrain.levelConf.rockFallStyle.outsideCorner
            this.worldMgr.sceneMgr.addMiscAnim(rockFallAnimName, this.getCenterWorld(), crumbleAngle, false)
        } else if (wallNeighbors.length === 3) {
            const nonWallNeighbor = this.neighbors.filter((n) => !n.wallType)[0]
            const crumbleAngle = Math.atan2(this.x - nonWallNeighbor.x, this.y - nonWallNeighbor.y)
            const rockFallAnimName = this.terrain.levelConf.rockFallStyle.threeSides
            this.worldMgr.sceneMgr.addMiscAnim(rockFallAnimName, this.getCenterWorld(), crumbleAngle, false)
        } else {
            const crumbleAngle = !!randomWallNeighbor ? Math.atan2(randomWallNeighbor.x - this.x, randomWallNeighbor.y - this.y) : 0
            const rockFallAnimName = this.terrain.levelConf.rockFallStyle.tunnel
            this.worldMgr.sceneMgr.addMiscAnim(rockFallAnimName, this.getCenterWorld(), crumbleAngle, false)
        }
        // update meshes and wallType
        this.terrain.updateSurfaceMeshes()
        this.generateSpiders()
    }

    private dropContainedMaterials(droppedOre: number, droppedCrystals: number) {
        for (let c = 0; c < droppedOre && this.containedOres > 0; c++) {
            this.containedOres--
            MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.ORE, this.getRandomPosition())
            EventBroker.publish(new OreFoundEvent())
        }
        for (let c = 0; c < droppedCrystals; c++) {
            const crystal = MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.CRYSTAL, this.getRandomPosition())
            EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_CRYSTAL_FOUND, this.worldMgr.ecs.getComponents(crystal.entity).get(PositionComponent)))
        }
    }

    private generateSpiders() {
        if (!this.terrain.levelConf.generateSpiders) return
        if (PRNG.terrain.random() > 0.1) return
        const numSpiders = Math.pow(Math.round(1 + PRNG.terrain.random()), 2) * Math.round(1 + PRNG.terrain.random())
        for (let c = 0; c < numSpiders; c++) {
            MonsterSpawner.spawnMonster(this.worldMgr, EntityType.SMALL_SPIDER, this.getRandomPosition(), PRNG.animation.random() * 2 * Math.PI)
        }
    }

    getRandomPosition(): Vector2 {
        return new Vector2(this.x * TILESIZE + TILESIZE / 4 + PRNG.terrain.random() * TILESIZE / 2,
            this.y * TILESIZE + TILESIZE / 4 + PRNG.terrain.random() * TILESIZE / 2)
    }

    cancelJobs() {
        this.drillJob = Surface.safeRemoveJob(this.drillJob)
        this.reinforceJob = Surface.safeRemoveJob(this.reinforceJob)
        this.dynamiteJob = undefined // Dynamite is carried back to storage
        this.clearRubbleJob = Surface.safeRemoveJob(this.clearRubbleJob)
        this.updateJobColor()
    }

    private static safeRemoveJob(job?: Job): undefined {
        if (job) job.jobState = JobState.CANCELED
        return undefined
    }

    reduceRubble() {
        this.rubblePositions.shift()
        let hiddenInRubble: number = this.containedOres
        switch (this.surfaceType) {
            case SurfaceType.RUBBLE4:
                this.setSurfaceType(SurfaceType.RUBBLE3)
                hiddenInRubble = 3
                break
            case SurfaceType.RUBBLE3:
                this.setSurfaceType(SurfaceType.RUBBLE2)
                hiddenInRubble = 2
                break
            case SurfaceType.RUBBLE2:
                this.setSurfaceType(SurfaceType.RUBBLE1)
                hiddenInRubble = 1
                break
            case SurfaceType.RUBBLE1:
                this.setSurfaceType(SurfaceType.GROUND)
                hiddenInRubble = 0
                break
        }
        this.dropContainedMaterials(this.containedOres - hiddenInRubble, 0)
        if (this.selected) EventBroker.publish(new SelectionChanged(this.worldMgr.entityMgr))
    }

    isUnstable(): boolean {
        if (this.surfaceType.floor) return false
        const adjacent = this.terrain.getAdjacent(this.x, this.y)
        return [adjacent.left, adjacent.topLeft, adjacent.top].some((s) => s.discovered && s.surfaceType.floor)
            && [adjacent.top, adjacent.topRight, adjacent.right].some((s) => s.discovered && s.surfaceType.floor)
            && [adjacent.right, adjacent.bottomRight, adjacent.bottom].some((s) => s.discovered && s.surfaceType.floor)
            && [adjacent.bottom, adjacent.bottomLeft, adjacent.left].some((s) => s.discovered && s.surfaceType.floor)
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
        const high = [this, s1, s2, s3].some((s) => !s.discovered) || ![this, s1, s2, s3].some((s) => s.surfaceType.floor)
        const minSeamProgress = Math.min(this.getSeamProgress(), s1.getSeamProgress(), s2.getSeamProgress(), s3.getSeamProgress())
        const offset = this.terrain.getHeightOffset(x, y)
        return new SurfaceVertex(high, minSeamProgress, offset)
    }

    private getSeamProgress(): number {
        return this.seamLevel / SURFACE_NUM_SEAM_LEVELS || 1
    }

    private updateWallType(topLeft: SurfaceVertex, topRight: SurfaceVertex, bottomRight: SurfaceVertex, bottomLeft: SurfaceVertex) {
        let wallType = Number(topLeft.high) + Number(topRight.high) + Number(bottomRight.high) + Number(bottomLeft.high)
        if (wallType === WALL_TYPE.WALL && topLeft.high === bottomRight.high) wallType = WALL_TYPE.WEIRD_CREVICE
        this.wallType = wallType
        this.mesh.setHeights(wallType, topLeft, topRight, bottomRight, bottomLeft)
        this.roofMesh.setHeights(wallType, topLeft, topRight, bottomRight, bottomLeft)
        if (this.wallType !== WALL_TYPE.WALL) {
            this.cancelReinforceJobs()
            const emergeComponent = this.worldMgr.ecs.getComponents(this.entity).get(EmergeComponent)
            if (emergeComponent) emergeComponent.emergeSurface = undefined
        }
    }

    cancelReinforceJobs() {
        this.reinforceJob = Surface.safeRemoveJob(this.reinforceJob)
        this.updateJobColor()
    }

    updateTexture() {
        let suffix = '', rotation = 0
        if (!this.discovered) {
            suffix = '70'
        } else if (this.wallType === WALL_TYPE.WEIRD_CREVICE) {
            suffix = '77'
        } else if (this.wallType) {
            if (this.wallType === WALL_TYPE.CORNER) {
                suffix = this.surfaceType.shaping ? '5' + this.surfaceType.matIndex : this.surfaceType.matIndex
            } else if (this.wallType === WALL_TYPE.INVERTED_CORNER) {
                suffix = '3' + (this.surfaceType.shaping ? this.surfaceType.matIndex : SurfaceType.SOLID_ROCK.matIndex)
            } else if (this.reinforced) {
                suffix = '2' + (this.surfaceType.shaping ? this.surfaceType.matIndex : '1')
            } else if (this.wallType === WALL_TYPE.WALL) {
                suffix = this.surfaceType.shaping ? '0' + this.surfaceType.matIndex : this.surfaceType.matIndex
            } else {
                suffix = '00'
            }
        } else if (this.surfaceType === SurfaceType.POWER_PATH_BUILDING && this.energized && this.building) {
            suffix = '66'
        } else if (this.surfaceType === SurfaceType.POWER_PATH) {
            const powerPath = this.determinePowerPathTextureNameSuffixAndRotation(rotation, suffix)
            rotation = powerPath.rotation
            suffix = powerPath.suffix
        } else {
            suffix = this.surfaceType.shaping ? '0' + this.surfaceType.matIndex : this.surfaceType.matIndex
        }
        const textureFilepath = this.terrain.levelConf.textureBasename + suffix + '.bmp'
        this.mesh.setTexture(textureFilepath, rotation)
        this.roofMesh.setTexture(this.terrain.levelConf.roofTexture, rotation)
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

    setEnergized(energized: boolean) {
        if (this.energized === energized) return
        this.energized = energized
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
        if (this.surfaceType.floor) SoundManager.playSfxSound('SFX_Floor')
        else if (this.surfaceType.shaping) SoundManager.playSfxSound('SFX_Wall')
        if (DEV_MODE) console.log(`Surface selected ${this.x}/${this.y}`, this)
        return true
    }

    deselect() {
        this.selected = false
        this.updateJobColor()
    }

    updateJobColor() {
        if (this.selected) return
        let color = 0xffffff
        if (this.dynamiteJob) {
            color = 0xa06060
        } else if (this.reinforceJob) {
            color = 0x60a060
        } else if (this.drillJob) {
            color = 0xa0a0a0
        }
        this.mesh.setHighlightColor(color)
    }

    hasRubble(): boolean {
        return this.surfaceType.hasRubble
    }

    isPath(): boolean {
        return this.surfaceType === SurfaceType.POWER_PATH || this.surfaceType === SurfaceType.POWER_PATH_BUILDING
    }

    isWalkable(): boolean {
        return this.surfaceType.floor && this.discovered && this.surfaceType !== SurfaceType.LAVA5 && this.surfaceType !== SurfaceType.WATER && !this.pathBlockedByBuilding
    }

    isDigable(): boolean {
        return this.surfaceType.digable && this.discovered && (this.wallType === WALL_TYPE.WALL || this.wallType === WALL_TYPE.CORNER)
    }

    isReinforcable(): boolean {
        return this.surfaceType.reinforcable && this.discovered && this.wallType === WALL_TYPE.WALL && !this.reinforced
    }

    getDigPositions(): Vector2[] {
        const digPosition: Vector2[] = []
        if (this.terrain.getSurface(this.x - 1, this.y).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE - 1, this.y * TILESIZE + TILESIZE / 2))
        if (this.terrain.getSurface(this.x, this.y - 1).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE + TILESIZE / 2, this.y * TILESIZE - 1))
        if (this.terrain.getSurface(this.x + 1, this.y).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE + TILESIZE + 1, this.y * TILESIZE + TILESIZE / 2))
        if (this.terrain.getSurface(this.x, this.y + 1).isWalkable()) digPosition.push(new Vector2(this.x * TILESIZE + TILESIZE / 2, this.y * TILESIZE + TILESIZE + 1))
        return digPosition
    }

    reinforce() {
        this.reinforced = true
        this.cancelReinforceJobs()
        this.updateTexture()
        EventBroker.publish(new UpdateRadarSurface(this))
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
        this.roofMesh?.dispose()
    }

    get neighbors(): Surface[] {
        return [
            this.terrain.getSurface(this.x - 1, this.y), this.terrain.getSurface(this.x, this.y - 1),
            this.terrain.getSurface(this.x + 1, this.y), this.terrain.getSurface(this.x, this.y + 1),
        ]
    }

    get neighbors8(): Surface[] {
        return [
            ...this.neighbors,
            this.terrain.getSurface(this.x - 1, this.y - 1), this.terrain.getSurface(this.x - 1, this.y + 1),
            this.terrain.getSurface(this.x + 1, this.y + 1), this.terrain.getSurface(this.x + 1, this.y - 1),
        ]
    }

    get neighborsFence(): Surface[] {
        return [
            this.terrain.getSurface(this.x - 1, this.y), this.terrain.getSurface(this.x, this.y - 1),
            this.terrain.getSurface(this.x + 1, this.y), this.terrain.getSurface(this.x, this.y + 1),
            this.terrain.getSurface(this.x - 2, this.y), this.terrain.getSurface(this.x, this.y - 2),
            this.terrain.getSurface(this.x + 2, this.y), this.terrain.getSurface(this.x, this.y + 2),
        ]
    }

    setBuilding(building?: BuildingEntity) {
        this.building = building
        this.setSurfaceType(this.building ? SurfaceType.POWER_PATH_BUILDING : SurfaceType.GROUND)
    }

    setSurfaceType(surfaceType: SurfaceType) {
        if (surfaceType === this.surfaceType) return
        const oldSurfaceType = this.surfaceType
        const wasPath = this.surfaceType === SurfaceType.POWER_PATH || this.surfaceType === SurfaceType.POWER_PATH_BUILDING
        this.surfaceType = surfaceType
        if (this.surfaceType === SurfaceType.WATER || this.surfaceType === SurfaceType.LAVA5) {
            this.worldMgr.ecs.addComponent(this.entity, new FluidSurfaceComponent(this.x, this.y, this.mesh.geometry.attributes.uv))
        } else {
            this.worldMgr.ecs.removeComponent(this.entity, FluidSurfaceComponent)
        }
        this.updateTexture()
        this.updateObjectName()
        if (oldSurfaceType.connectsPath || this.surfaceType.connectsPath) this.neighbors.forEach((n) => n.updateTexture())
        EventBroker.publish(new UpdateRadarSurface(this))
        if (wasPath !== this.isPath()) this.worldMgr.powerGrid.onPathChange(this)
        this.terrain.pathFinder.updateSurface(this)
        if (this.selected && !this.surfaceType.selectable) EventBroker.publish(new DeselectAll())
        if (this.surfaceType === SurfaceType.LAVA5) {
            this.site?.cancelSite()
            const materials = [...this.worldMgr.entityMgr.materials] // list will be changed by dispose below
            materials.forEach((m) => { // XXX Optimize performance
                const materialSurface = m.getSurface()
                if (materialSurface === this) {
                    m.carryJob?.target?.site?.unAssign(m)
                    m.disposeFromWorld()
                }
            })
        } else if ([SurfaceType.RUBBLE4, SurfaceType.RUBBLE3, SurfaceType.RUBBLE2, SurfaceType.RUBBLE1].includes(this.surfaceType)) {
            if (this.rubblePositions.length < 1) this.rubblePositions = [this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition(), this.getRandomPosition()]
            if (oldSurfaceType === SurfaceType.POWER_PATH) {
                this.containedOres += 2
            }
        }
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

    setupDrillJob(): DrillJob | undefined {
        if (!this.isDigable()) return undefined
        if (this.drillJob) return this.drillJob
        this.drillJob = new DrillJob(this)
        EventBroker.publish(new JobCreateEvent(this.drillJob))
        this.updateJobColor()
        return this.drillJob
    }

    setupReinforceJob(): void {
        if (!this.isReinforcable() || this.reinforceJob) return
        this.reinforceJob = new ReinforceJob(this)
        EventBroker.publish(new JobCreateEvent(this.reinforceJob))
        this.updateJobColor()
    }

    setupDynamiteJob(): void {
        if (!this.isDigable() || this.dynamiteJob) return
        const targetBuilding = this.worldMgr.entityMgr.getClosestBuildingByType(this.getCenterWorld(), EntityType.TOOLSTATION) // XXX performance cache this
        if (!targetBuilding) throw new Error('Could not find toolstation to spawn dynamite')
        const material = MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.DYNAMITE, targetBuilding.getDropPosition2D(), targetBuilding.sceneEntity.heading, this)
        this.dynamiteJob = material.carryJob
        this.updateJobColor()
    }

    setupClearRubbleJob(): ClearRubbleJob | undefined {
        if (!this.hasRubble()) return undefined
        if (this.clearRubbleJob) return this.clearRubbleJob
        this.clearRubbleJob = new ClearRubbleJob(this)
        this.updateJobColor()
        EventBroker.publish(new JobCreateEvent(this.clearRubbleJob))
        return this.clearRubbleJob
    }

    isBlockedByVehicle() {
        return this.worldMgr.entityMgr.vehicles.some((v) => v.getSurface() === this)
    }

    isBlockedByRaider() {
        return this.worldMgr.entityMgr.raiders.some((r) => r.getSurface() === this)
    }

    isBlocked(): boolean {
        return this.isBlockedByRaider() || this.isBlockedByVehicle()
    }
}
