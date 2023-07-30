import { Group, Vector2 } from 'three'
import { EventBus } from '../../../event/EventBus'
import { DeselectAll } from '../../../event/LocalEvents'
import { TILESIZE } from '../../../params'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { SurfaceType } from '../../terrain/SurfaceType'
import { BuildingSite } from './BuildingSite'
import { BuildingType } from './BuildingType'
import { BuildPlacementMarkerMesh } from './BuildPlacementMarkerMesh'
import { PositionComponent } from '../../component/PositionComponent'

export class BuildPlacementMarker {
    static readonly goodBuildingMarkerColor: number = 0x005000
    static readonly goodPathMarkerColor: number = 0x505000
    static readonly goodWaterMarkerColor: number = 0x000050
    static readonly invalidMarkerColor: number = 0x500000
    static readonly tooSteepMarkerColor: number = 0x500050

    group: Group = new Group()
    markers: BuildPlacementMarkerMesh[] = []
    buildingMarkerPrimary: BuildPlacementMarkerMesh = null
    buildingMarkerSecondary: BuildPlacementMarkerMesh = null
    powerPathMarkerPrimary: BuildPlacementMarkerMesh = null
    powerPathMarkerSecondary: BuildPlacementMarkerMesh = null
    waterPathMarker: BuildPlacementMarkerMesh = null
    heading: number = 0
    lastCheck: boolean = false
    buildingType: BuildingType = null
    buildingMarkerColor: number = BuildPlacementMarker.goodBuildingMarkerColor
    pathMarkerColor: number = BuildPlacementMarker.goodPathMarkerColor
    waterMarkerColor: number = BuildPlacementMarker.goodWaterMarkerColor

    constructor(readonly worldMgr: WorldManager) {
        this.buildingMarkerPrimary = new BuildPlacementMarkerMesh(this.worldMgr.sceneMgr)
        this.buildingMarkerSecondary = new BuildPlacementMarkerMesh(this.worldMgr.sceneMgr)
        this.powerPathMarkerPrimary = new BuildPlacementMarkerMesh(this.worldMgr.sceneMgr)
        this.powerPathMarkerSecondary = new BuildPlacementMarkerMesh(this.worldMgr.sceneMgr)
        this.waterPathMarker = new BuildPlacementMarkerMesh(this.worldMgr.sceneMgr)
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
            this.updateAllMarker(worldPosition)
            this.buildingMarkerPrimary.setColor(this.buildingMarkerColor)
            this.buildingMarkerSecondary.setColor(this.buildingMarkerColor)
            this.powerPathMarkerPrimary.setColor(this.pathMarkerColor)
            this.powerPathMarkerSecondary.setColor(this.pathMarkerColor)
            this.waterPathMarker.setColor(this.waterMarkerColor)
        }
    }

    private updateAllMarker(worldPosition: Vector2) {
        this.buildingMarkerPrimary.updateMesh(worldPosition, new Vector2(0, 0))
        const sdxv = worldPosition.x - this.buildingMarkerPrimary.position.x - TILESIZE / 2
        const sdzv = worldPosition.y - this.buildingMarkerPrimary.position.z - TILESIZE / 2
        const sdx = Math.abs(sdxv) > Math.abs(sdzv) ? Math.sign(sdxv) : 0
        const sdz = Math.abs(sdzv) > Math.abs(sdxv) ? Math.sign(sdzv) : 0
        this.heading = Math.atan2(sdz, sdx)
        this.buildingMarkerSecondary.updateMesh(worldPosition, this.buildingType.secondaryBuildingPart, this.heading)
        this.powerPathMarkerPrimary.updateMesh(worldPosition, this.buildingType.primaryPowerPath, this.heading)
        this.powerPathMarkerSecondary.updateMesh(worldPosition, this.buildingType.secondaryPowerPath, this.heading)
        this.waterPathMarker.updateMesh(worldPosition, this.buildingType.waterPathSurface, this.heading)
        const allNonWaterPathsAreGround = [this.buildingMarkerPrimary, this.buildingMarkerSecondary, this.powerPathMarkerPrimary, this.powerPathMarkerSecondary]
            .filter((c) => c.visible).map((c) => this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(c.position)).every((s) => s.surfaceType === SurfaceType.GROUND && !s.fence && !s.fenceRequested)
        const isGood = allNonWaterPathsAreGround && (
            [this.powerPathMarkerPrimary, this.powerPathMarkerSecondary].some((c) => c.visible && c.surface.neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH)) ||
            (!this.buildingType.primaryPowerPath && (this.buildingMarkerPrimary.surface.neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH ||
                (this.buildingMarkerSecondary.visible && this.buildingMarkerSecondary.surface.neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH)))))
        ) && (!this.waterPathMarker.visible || this.waterPathMarker.surface.surfaceType === SurfaceType.WATER)
            && ![this.buildingMarkerPrimary, this.buildingMarkerSecondary, this.powerPathMarkerPrimary, this.powerPathMarkerSecondary]
                .some((c) => [...this.worldMgr.entityMgr.rockMonsters, ...this.worldMgr.entityMgr.slugs]
                    .some((m) => this.worldMgr.ecs.getComponents(m).get(PositionComponent).surface === c.surface))
        if (isGood) {
            const heightOffset = this.worldMgr.sceneMgr.terrain.heightOffset
            const tooSteep = [this.buildingMarkerPrimary?.surface, this.buildingMarkerSecondary?.surface].some((s) => {
                if (!s) return false
                const offsets = [heightOffset[s.x][s.y], heightOffset[s.x + 1][s.y], heightOffset[s.x + 1][s.y + 1], heightOffset[s.x][s.y + 1]]
                return Math.abs(Math.max(...offsets) - Math.min(...offsets)) > 0.2
            })
            if (tooSteep) {
                this.lastCheck = false
                this.buildingMarkerColor = BuildPlacementMarker.tooSteepMarkerColor
                this.pathMarkerColor = BuildPlacementMarker.goodPathMarkerColor
                this.waterMarkerColor = BuildPlacementMarker.goodWaterMarkerColor
            } else {
                this.lastCheck = true
                this.buildingMarkerColor = BuildPlacementMarker.goodBuildingMarkerColor
                this.pathMarkerColor = BuildPlacementMarker.goodPathMarkerColor
                this.waterMarkerColor = BuildPlacementMarker.goodWaterMarkerColor
            }
        } else {
            this.lastCheck = false
            this.buildingMarkerColor = BuildPlacementMarker.invalidMarkerColor
            this.pathMarkerColor = BuildPlacementMarker.invalidMarkerColor
            this.waterMarkerColor = BuildPlacementMarker.invalidMarkerColor
        }
    }

    hideAllMarker() {
        this.markers.forEach((m) => m.visible = false)
        this.lastCheck = false
        this.buildingMarkerColor = BuildPlacementMarker.invalidMarkerColor
        this.pathMarkerColor = BuildPlacementMarker.invalidMarkerColor
        this.waterMarkerColor = BuildPlacementMarker.invalidMarkerColor
    }

    createBuildingSite() {
        if (!this.buildingType || !this.lastCheck) return
        const barrierLocations = this.getBarrierLocations()
        const stats = this.buildingType.stats
        const neededCrystals = stats?.CostCrystal || 0
        const neededBricks = stats?.CostRefinedOre || 0
        const neededOres = stats?.CostOre || 0
        const needsAnything = neededCrystals || neededOres || neededBricks
        const primarySurface = this.buildingMarkerPrimary.surface
        const site = new BuildingSite(this.worldMgr, primarySurface, this.buildingMarkerSecondary.surface, this.powerPathMarkerPrimary.surface, this.powerPathMarkerSecondary.surface, this.buildingType)
        primarySurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
        site.heading = this.heading
        if (needsAnything) site.neededByType.set(EntityType.BARRIER, barrierLocations.length)
        site.neededByType.set(EntityType.CRYSTAL, neededCrystals)
        if (this.worldMgr.entityMgr.hasBuilding(EntityType.ORE_REFINERY)) {
            site.neededByType.set(EntityType.BRICK, neededBricks)
        } else {
            site.neededByType.set(EntityType.ORE, neededOres)
        }
        this.worldMgr.entityMgr.buildingSites.push(site)
        EventBus.publishEvent(new DeselectAll())
        const closestToolstation = this.worldMgr.entityMgr.getClosestBuildingByType(primarySurface.getCenterWorld(), EntityType.TOOLSTATION)
        if (needsAnything) {
            if (closestToolstation) {
                closestToolstation.spawnBarriers(barrierLocations, site)
                closestToolstation.spawnMaterials(EntityType.CRYSTAL, neededCrystals)
                closestToolstation.spawnMaterials(EntityType.BRICK, neededBricks)
                closestToolstation.spawnMaterials(EntityType.ORE, neededOres)
            }
        } else {
            site.checkComplete()
        }
        this.worldMgr.sceneMgr.setBuildModeSelection(null)
    }

    getBarrierLocations(): Vector2[] {
        const barrierLocations: Vector2[] = []
        const centerPrimary = this.buildingMarkerPrimary.surface.getCenterWorld2D()
        const barrierOffset = TILESIZE * 9 / 20
        if (this.buildingMarkerSecondary.visible) {
            const centerSecondary = this.buildingMarkerSecondary.surface.getCenterWorld2D()
            const dx = Math.sign(centerSecondary.x - centerPrimary.x)
            const dy = Math.sign(centerSecondary.y - centerPrimary.y)
            if (dx !== 0) {
                barrierLocations.push(new Vector2(centerPrimary.x - dx * barrierOffset, centerPrimary.y))
                barrierLocations.push(new Vector2(centerPrimary.x, centerPrimary.y - barrierOffset))
                barrierLocations.push(new Vector2(centerPrimary.x, centerPrimary.y + barrierOffset))
                barrierLocations.push(new Vector2(centerSecondary.x + dx * barrierOffset, centerSecondary.y))
                barrierLocations.push(new Vector2(centerSecondary.x, centerSecondary.y - barrierOffset))
                barrierLocations.push(new Vector2(centerSecondary.x, centerSecondary.y + barrierOffset))
            } else {
                barrierLocations.push(new Vector2(centerPrimary.x, centerPrimary.y - dy * barrierOffset))
                barrierLocations.push(new Vector2(centerPrimary.x - barrierOffset, centerPrimary.y))
                barrierLocations.push(new Vector2(centerPrimary.x + barrierOffset, centerPrimary.y))
                barrierLocations.push(new Vector2(centerSecondary.x, centerSecondary.y + dy * barrierOffset))
                barrierLocations.push(new Vector2(centerSecondary.x - barrierOffset, centerSecondary.y))
                barrierLocations.push(new Vector2(centerSecondary.x + barrierOffset, centerSecondary.y))
            }
        } else {
            barrierLocations.push(new Vector2(centerPrimary.x - barrierOffset, centerPrimary.y))
            barrierLocations.push(new Vector2(centerPrimary.x, centerPrimary.y - barrierOffset))
            barrierLocations.push(new Vector2(centerPrimary.x + barrierOffset, centerPrimary.y))
            barrierLocations.push(new Vector2(centerPrimary.x, centerPrimary.y + barrierOffset))
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
