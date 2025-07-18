import { Group, Vector2, Vector3 } from 'three'
import { DeselectAll } from '../../../event/LocalEvents'
import { TILESIZE } from '../../../params'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { SurfaceType } from '../../terrain/SurfaceType'
import { BuildingSite } from './BuildingSite'
import { BuildingType } from './BuildingType'
import { BuildPlacementMarkerMesh } from './BuildPlacementMarkerMesh'
import { PositionComponent } from '../../component/PositionComponent'
import { MaterialAmountChanged } from '../../../event/WorldEvents'
import { EventBroker } from '../../../event/EventBroker'

export class BuildPlacementMarker {
    static readonly goodBuildingMarkerColor: number = 0x005000
    static readonly goodPathMarkerColor: number = 0x505000
    static readonly goodWaterMarkerColor: number = 0x000050
    static readonly invalidMarkerColor: number = 0x500000
    static readonly tooSteepMarkerColor: number = 0x500050

    readonly group: Group = new Group()
    readonly markers: BuildPlacementMarkerMesh[] = []
    readonly buildingMarkerPrimary: BuildPlacementMarkerMesh
    readonly buildingMarkerSecondary: BuildPlacementMarkerMesh
    readonly powerPathMarkerPrimary: BuildPlacementMarkerMesh
    readonly powerPathMarkerSecondary: BuildPlacementMarkerMesh
    readonly waterPathMarker: BuildPlacementMarkerMesh
    heading: number = 0
    lastCheck: boolean = false
    buildingType?: BuildingType
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

    updatePosition(worldPosition?: Vector3) {
        if (!worldPosition || !this.buildingType) {
            this.hideAllMarker()
        } else {
            this.worldMgr.sceneMgr.birdViewControls.setBuildLock(true)
            this.updateAllMarker(new Vector2(worldPosition.x, worldPosition.z))
            this.buildingMarkerPrimary.setColor(this.buildingMarkerColor)
            this.buildingMarkerSecondary.setColor(this.buildingMarkerColor)
            this.powerPathMarkerPrimary.setColor(this.pathMarkerColor)
            this.powerPathMarkerSecondary.setColor(this.pathMarkerColor)
            this.waterPathMarker.setColor(this.waterMarkerColor)
        }
    }

    private updateAllMarker(worldPosition: Vector2) {
        if (!this.buildingType) return
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
                [this.powerPathMarkerPrimary, this.powerPathMarkerSecondary].some((c) => c.visible && c.getSurface().neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH)) ||
                (!this.buildingType.primaryPowerPath && (this.buildingMarkerPrimary.getSurface().neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH ||
                    (this.buildingMarkerSecondary.visible && this.buildingMarkerSecondary.getSurface().neighbors.some((n) => n.surfaceType === SurfaceType.POWER_PATH)))))
            ) && (!this.waterPathMarker.visible || this.waterPathMarker.getSurface().surfaceType === SurfaceType.WATER)
            && ![this.buildingMarkerPrimary, this.buildingMarkerSecondary, this.powerPathMarkerPrimary, this.powerPathMarkerSecondary]
                .some((c) => [...this.worldMgr.entityMgr.rockMonsters, ...this.worldMgr.entityMgr.slugs]
                    .some((m) => this.worldMgr.ecs.getComponents(m).get(PositionComponent).surface === c.getSurface()))
        if (isGood) {
            const tooSteep = [this.buildingMarkerPrimary.getVisibleSurface(), this.buildingMarkerSecondary.getVisibleSurface()].some((s) => {
                if (!s) return false
                const offsets = [
                    this.worldMgr.sceneMgr.terrain.getHeightOffset(s.x, s.y),
                    this.worldMgr.sceneMgr.terrain.getHeightOffset(s.x + 1, s.y),
                    this.worldMgr.sceneMgr.terrain.getHeightOffset(s.x + 1, s.y + 1),
                    this.worldMgr.sceneMgr.terrain.getHeightOffset(s.x, s.y + 1)
                ]
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
        this.worldMgr.sceneMgr.birdViewControls.setBuildLock(false)
        this.markers.forEach((m) => m.visible = false)
        this.lastCheck = false
        this.buildingMarkerColor = BuildPlacementMarker.invalidMarkerColor
        this.pathMarkerColor = BuildPlacementMarker.invalidMarkerColor
        this.waterMarkerColor = BuildPlacementMarker.invalidMarkerColor
    }

    createBuildingSite() {
        if (!this.buildingType) return
        const barrierLocations = this.getBarrierLocations()
        const stats = this.buildingType.stats
        const neededCrystals = stats?.costCrystal || 0
        const neededBricks = stats?.costRefinedOre || 0
        const neededOres = stats?.costOre || 0
        const needsAnything = neededCrystals || neededOres || neededBricks
        const primarySurface = this.buildingMarkerPrimary.getSurface()
        const site = new BuildingSite(this.worldMgr, primarySurface, this.buildingMarkerSecondary.getVisibleSurface(), this.powerPathMarkerPrimary.getVisibleSurface(), this.powerPathMarkerSecondary.getVisibleSurface(), this.buildingType)
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
        EventBroker.publish(new DeselectAll())
        if (needsAnything) {
            const closestToolstation = this.worldMgr.entityMgr.getClosestBuildingByType(primarySurface.getCenterWorld(), EntityType.TOOLSTATION)
            if (closestToolstation) {
                closestToolstation.spawnBarriers(barrierLocations, site)
                closestToolstation.spawnMaterials(EntityType.CRYSTAL, neededCrystals)
                closestToolstation.spawnMaterials(EntityType.BRICK, neededBricks)
                closestToolstation.spawnMaterials(EntityType.ORE, neededOres)
                EventBroker.publish(new MaterialAmountChanged())
            }
        } else {
            site.checkComplete()
        }
        this.worldMgr.sceneMgr.setBuildModeSelection(undefined)
    }

    getBarrierLocations(): Vector2[] {
        const barrierLocations: Vector2[] = []
        const centerPrimary = this.buildingMarkerPrimary.getSurface().getCenterWorld2D()
        const barrierOffset = TILESIZE * 9 / 20
        if (this.buildingMarkerSecondary.visible) {
            const centerSecondary = this.buildingMarkerSecondary.getSurface().getCenterWorld2D()
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

    setBuildMode(entityType: EntityType | undefined) {
        this.buildingType = entityType ? BuildingType.from(entityType) : undefined
        if (!this.buildingType) this.hideAllMarker()
    }

    hasBuildMode(): boolean {
        return !!this.buildingType
    }
}
