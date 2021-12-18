import { Group, Vector2 } from 'three'
import { EventBus } from '../../../event/EventBus'
import { CancelBuildMode } from '../../../event/GuiCommand'
import { DeselectAll } from '../../../event/LocalEvents'
import { TILESIZE } from '../../../params'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { SurfaceType } from '../map/SurfaceType'
import { BarrierLocation } from '../material/BarrierLocation'
import { BuildingSite } from './BuildingSite'
import { BuildPlacementMarkerMesh } from './BuildPlacementMarkerMesh'
import { BuildingType } from './BuildingType'

export class BuildPlacementMarker {
    static readonly buildingMarkerColor: number = 0x005000
    static readonly pathMarkerColor: number = 0x505000
    static readonly waterMarkerColor: number = 0x000050

    worldMgr: WorldManager
    sceneMgr: SceneManager
    entityMgr: EntityManager
    group: Group = new Group()
    markers: BuildPlacementMarkerMesh[] = []
    buildingMarkerPrimary: BuildPlacementMarkerMesh = null
    buildingMarkerSecondary: BuildPlacementMarkerMesh = null
    powerPathMarkerPrimary: BuildPlacementMarkerMesh = null
    powerPathMarkerSecondary: BuildPlacementMarkerMesh = null
    waterPathMarker: BuildPlacementMarkerMesh = null
    heading: number = 0
    sdx: number = 0
    sdz: number = 0
    lastCheck: boolean = false
    buildingType: BuildingType = null

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityMgr: EntityManager) {
        this.worldMgr = worldMgr
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
        this.buildingMarkerPrimary = new BuildPlacementMarkerMesh(this.sceneMgr, BuildPlacementMarker.buildingMarkerColor)
        this.buildingMarkerSecondary = new BuildPlacementMarkerMesh(this.sceneMgr, BuildPlacementMarker.buildingMarkerColor)
        this.powerPathMarkerPrimary = new BuildPlacementMarkerMesh(this.sceneMgr, BuildPlacementMarker.pathMarkerColor)
        this.powerPathMarkerSecondary = new BuildPlacementMarkerMesh(this.sceneMgr, BuildPlacementMarker.pathMarkerColor)
        this.waterPathMarker = new BuildPlacementMarkerMesh(this.sceneMgr, BuildPlacementMarker.waterMarkerColor)
        this.addMarker(this.buildingMarkerPrimary)
        this.addMarker(this.buildingMarkerSecondary)
        this.addMarker(this.powerPathMarkerPrimary)
        this.addMarker(this.powerPathMarkerSecondary)
        this.addMarker(this.waterPathMarker)
    }

    private addMarker(marker: BuildPlacementMarkerMesh) {
        this.group.add(marker)
        this.markers.push(marker)
    }

    updatePosition(worldPosition: Vector2) {
        if (!worldPosition || !this.buildingType) {
            this.hideAllMarker()
        } else {
            const isValid = this.updateAllMarker(worldPosition)
            this.markers.forEach((c) => c.markAsValid(isValid))
        }
    }

    private updateAllMarker(worldPosition: Vector2 = null): boolean {
        // TODO use surface height offsets, refactor terrain map/data handling before
        this.buildingMarkerPrimary.visible = true
        this.buildingMarkerPrimary.position.copy(this.sceneMgr.getFloorPosition(new Vector2(Math.floor(worldPosition.x / TILESIZE) * TILESIZE, Math.floor(worldPosition.y / TILESIZE) * TILESIZE)))
        const sdxv = worldPosition.x - this.buildingMarkerPrimary.position.x - TILESIZE / 2
        const sdzv = worldPosition.y - this.buildingMarkerPrimary.position.z - TILESIZE / 2
        const sdx = Math.abs(sdxv) > Math.abs(sdzv) ? Math.sign(sdxv) : 0
        const sdz = Math.abs(sdzv) > Math.abs(sdxv) ? Math.sign(sdzv) : 0
        if (this.sdx === sdx && this.sdz === sdz) return this.lastCheck
        this.sdx = sdx
        this.sdz = sdz
        this.heading = Math.atan2(sdz, sdx)
        this.buildingMarkerSecondary.updateState(this.buildingType.secondaryBuildingPart, this.heading, this.buildingMarkerPrimary.position)
        this.powerPathMarkerPrimary.updateState(this.buildingType.primaryPowerPath, this.heading, this.buildingMarkerPrimary.position)
        this.powerPathMarkerSecondary.updateState(this.buildingType.secondaryPowerPath, this.heading, this.buildingMarkerPrimary.position)
        this.waterPathMarker.updateState(this.buildingType.waterPathSurface, this.heading, this.buildingMarkerPrimary.position)
        const allSurfacesAreGround = [this.buildingMarkerPrimary, this.buildingMarkerSecondary, this.powerPathMarkerPrimary, this.powerPathMarkerSecondary]
            .filter((c) => c.visible).map((c) => this.sceneMgr.terrain.getSurfaceFromWorld(c.position)).every((s) => s.surfaceType === SurfaceType.GROUND)
        this.lastCheck = allSurfacesAreGround && (
            [this.powerPathMarkerPrimary, this.powerPathMarkerSecondary].some((c) => c.visible && c.surface.neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH)) ||
            (!this.buildingType.primaryPowerPath && (this.buildingMarkerPrimary.surface.neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH ||
                (this.buildingMarkerSecondary.visible && this.buildingMarkerSecondary.surface.neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH)))))
        ) && (!this.waterPathMarker.visible || this.waterPathMarker.surface.surfaceType === SurfaceType.WATER)
        return this.lastCheck
    }

    hideAllMarker() {
        this.markers.forEach((m) => m.visible = false)
        this.lastCheck = false
    }

    createBuildingSite() {
        if (!this.buildingType || !this.lastCheck) return
        const barrierLocations = this.getBarrierLocations()
        const stats = this.buildingType.stats
        const neededCrystals = stats?.CostCrystal || 0
        const neededOre = stats?.CostOre || 0
        const primarySurface = this.buildingMarkerPrimary.surface
        const site = new BuildingSite(this.sceneMgr, this.entityMgr, primarySurface, this.buildingMarkerSecondary.surface, this.powerPathMarkerPrimary.surface, this.powerPathMarkerSecondary.surface, this.buildingType)
        primarySurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
        site.heading = this.heading
        site.neededByType.set(EntityType.BARRIER, barrierLocations.length)
        site.neededByType.set(EntityType.CRYSTAL, neededCrystals)
        site.neededByType.set(EntityType.ORE, neededOre)
        this.entityMgr.buildingSites.push(site)
        const closestToolstation = this.entityMgr.getClosestBuildingByType(primarySurface.getCenterWorld(), EntityType.TOOLSTATION)
        if (closestToolstation) {
            closestToolstation.spawnBarriers(barrierLocations, site)
            closestToolstation.spawnMaterials(EntityType.CRYSTAL, neededCrystals)
            closestToolstation.spawnMaterials(EntityType.ORE, neededOre)
        }
        EventBus.publishEvent(new DeselectAll())
        EventBus.publishEvent(new CancelBuildMode())
    }

    getBarrierLocations(): BarrierLocation[] {
        const barrierLocations: BarrierLocation[] = []
        const centerPrimary = this.buildingMarkerPrimary.surface.getCenterWorld2D()
        const barrierOffset = TILESIZE * 9 / 20
        if (this.buildingMarkerSecondary.visible) {
            const centerSecondary = this.buildingMarkerSecondary.surface.getCenterWorld2D()
            const dx = Math.sign(centerSecondary.x - centerPrimary.x)
            const dy = Math.sign(centerSecondary.y - centerPrimary.y)
            if (dx !== 0) {
                barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x - dx * barrierOffset, centerPrimary.y), centerPrimary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x, centerPrimary.y - barrierOffset), centerPrimary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x, centerPrimary.y + barrierOffset), centerPrimary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerSecondary.x + dx * barrierOffset, centerSecondary.y), centerSecondary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerSecondary.x, centerSecondary.y - barrierOffset), centerSecondary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerSecondary.x, centerSecondary.y + barrierOffset), centerSecondary))
            } else {
                barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x, centerPrimary.y - dy * barrierOffset), centerPrimary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x - barrierOffset, centerPrimary.y), centerPrimary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x + barrierOffset, centerPrimary.y), centerPrimary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerSecondary.x, centerSecondary.y + dy * barrierOffset), centerSecondary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerSecondary.x - barrierOffset, centerSecondary.y), centerSecondary))
                barrierLocations.push(new BarrierLocation(new Vector2(centerSecondary.x + barrierOffset, centerSecondary.y), centerSecondary))
            }
        } else {
            barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x - barrierOffset, centerPrimary.y), centerPrimary))
            barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x, centerPrimary.y - barrierOffset), centerPrimary))
            barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x + barrierOffset, centerPrimary.y), centerPrimary))
            barrierLocations.push(new BarrierLocation(new Vector2(centerPrimary.x, centerPrimary.y + barrierOffset), centerPrimary))
        }
        return barrierLocations
    }

    setBuildMode(entityType: EntityType) {
        this.buildingType = BuildingType.from(entityType)
        if (!this.buildingType) this.hideAllMarker()
    }

    hasBuildMode(): boolean {
        return !!this.buildingType
    }
}
