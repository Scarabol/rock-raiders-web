import { AnimationActivity, BarrierActivity, BuildingActivity, DynamiteActivity, RaiderActivity } from '../anim/AnimationActivity'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { Job, JobFulfiller } from './Job'
import { EntityType } from '../EntityType'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { ResourceManager } from '../../../resource/ResourceManager'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { DynamiteExplosionEvent } from '../../../event/WorldEvents'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { PositionComponent } from '../../component/PositionComponent'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { GameState } from '../GameState'

export class CarryJob extends Job {
    fulfiller: JobFulfiller = null
    target: PathTarget

    constructor(readonly carryItem: MaterialEntity) {
        super()
        this.requiredTraining = this.carryItem.requiredTraining
        this.priorityIdentifier = this.carryItem.priorityIdentifier
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (this.target && !(
            (this.target.building && !this.target.building.isPowered()) ||
            (this.target.site && (this.target.site.complete || this.target.site.canceled))
        )) {
            return this.target
        }
        if (this.target?.site) this.target.site.unAssign(this.carryItem)
        this.target = entity.findShortestPath(this.findWorkplaces())?.target
        if (this.target?.site) this.target.site.assign(this.carryItem)
        return this.target
    }

    private findWorkplaces() {
        switch (this.carryItem.entityType) {
            case EntityType.ORE:
                const oreSites = this.carryItem.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.carryItem.entityType))
                if (oreSites.length > 0) return oreSites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
                const oreRefineries = this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.ORE_REFINERY)
                if (oreRefineries.length > 0) return oreRefineries
                return this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
            case EntityType.CRYSTAL:
                const crystalSites = this.carryItem.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.carryItem.entityType))
                if (crystalSites.length > 0) return crystalSites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
                const powerStations = this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.POWER_STATION)
                if (powerStations.length > 0) return powerStations
                return this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
            case EntityType.BRICK:
                const sites = this.carryItem.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.carryItem.entityType))
                if (sites.length > 0) return sites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
                return this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
            case EntityType.BARRIER:
                if (this.carryItem.targetSite.complete || this.carryItem.targetSite.canceled) {
                    return this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
                } else {
                    return [PathTarget.fromSite(this.carryItem.targetSite, this.carryItem.location)]
                }
            case EntityType.DYNAMITE:
                if (this.carryItem.targetSurface?.isDigable()) {
                    return this.carryItem.targetSurface.getDigPositions().map((p) => PathTarget.fromLocation(p, this.carryItem.sceneEntity.getRadiusSquare() / 4))
                } else {
                    return this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
                }
            case EntityType.ELECTRIC_FENCE:
                if (!this.carryItem.targetSurface.isWalkable()) {
                    return this.carryItem.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
                } else {
                    return [PathTarget.fromLocation(this.carryItem.targetSurface.getCenterWorld2D())]
                }
        }
    }

    getWorkActivity(): AnimationActivity {
        return this.target.building?.getDropAction() || RaiderActivity.Place
    }

    isReadyToComplete(): boolean {
        if (!this.target) return false
        if (this.target.building?.entityType === EntityType.POWER_STATION || this.target.building?.entityType === EntityType.ORE_REFINERY) {
            return this.target.building.sceneEntity.currentAnimation === (this.target.building.isPowered() ? BuildingActivity.Stand : BuildingActivity.Unpowered)
        }
        return true
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        this.fulfiller.sceneEntity.headTowards(this.target.targetLocation)
        this.fulfiller.dropCarried(false)
        this.carryItem.sceneEntity.position.copy(this.carryItem.worldMgr.sceneMgr.getFloorPosition(this.target.targetLocation))
        this.carryItem.worldMgr.ecs.getComponents(this.carryItem.entity).get(PositionComponent).position.copy(this.carryItem.sceneEntity.position)
        if (this.target.building) {
            if (this.target.building.entityType === EntityType.POWER_STATION || this.target.building.entityType === EntityType.ORE_REFINERY) {
                this.target.building.pickupItem(this.carryItem)
                if (this.target.building.sceneEntity.carriedByIndex.size >= this.target.building.getMaxCarry()) {
                    if (this.target.building.entityType === EntityType.POWER_STATION) this.target.building.worldMgr.sceneMgr.addPositionalAudio(this.target.building.sceneEntity, Sample[Sample.SND_Refine], true, false)
                    this.target.building.sceneEntity.setAnimation(BuildingActivity.Deposit, () => {
                        this.target.building.sceneEntity.setAnimation(this.target.building.isPowered() ? BuildingActivity.Stand : BuildingActivity.Unpowered)
                        this.target.building.sceneEntity.removeAllCarried()
                        this.target.building.carriedItems.forEach((carried) => {
                            const floorPosition = carried.worldMgr.sceneMgr.terrain.getFloorPosition(carried.sceneEntity.position2D)
                            carried.sceneEntity.position.copy(floorPosition)
                            carried.worldMgr.sceneMgr.addMeshGroup(carried.sceneEntity)
                        })
                        this.target.building.depositItems()
                    })
                }
            } else {
                GameState.depositItem(this.carryItem)
                this.carryItem.disposeFromWorld()
            }
        } else {
            this.carryItem.sceneEntity.addToScene(this.carryItem.worldMgr.sceneMgr, null, null)
            if (this.carryItem.entityType === EntityType.BARRIER) {
                this.carryItem.sceneEntity.setAnimation(BarrierActivity.Expand, () => this.carryItem.sceneEntity.setAnimation(BarrierActivity.Long))
                this.carryItem.sceneEntity.lookAt(this.carryItem.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.carryItem.sceneEntity.position).getCenterWorld())
            }
            this.target.site?.addItem(this.carryItem)
        }
        if (this.carryItem.entityType === EntityType.DYNAMITE) this.igniteDynamite()
        else if (this.carryItem.entityType === EntityType.ELECTRIC_FENCE) this.placeFence()
    }

    private igniteDynamite() {
        const positionComponent = this.carryItem.worldMgr.ecs.getComponents(this.carryItem.entity).get(PositionComponent)
        this.carryItem.worldMgr.entityMgr.raiderScare.add(positionComponent)
        this.carryItem.sceneEntity.headTowards(this.carryItem.targetSurface.getCenterWorld2D())
        this.carryItem.sceneEntity.setAnimation(DynamiteActivity.TickDown, () => {
            this.carryItem.worldMgr.entityMgr.raiderScare.remove(positionComponent)
            this.carryItem.targetSurface.collapse()
            this.carryItem.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.Explosion, this.carryItem.sceneEntity.position, this.carryItem.sceneEntity.getHeading())
            this.carryItem.worldMgr.sceneMgr.addPositionalAudio(this.carryItem.sceneEntity, Sample[Sample.SFX_Dynamite], true, false)
            EventBus.publishEvent(new DynamiteExplosionEvent(this.carryItem.sceneEntity.position2D))
            this.carryItem.disposeFromWorld()
        })
    }

    private placeFence() {
        this.carryItem.sceneEntity.addToScene(this.carryItem.worldMgr.sceneMgr, null, null)
        const stats = ResourceManager.configuration.stats.electricFence
        const pickSphere = this.carryItem.worldMgr.ecs.getComponents(this.carryItem.entity).get(SceneSelectionComponent).pickSphere
        this.carryItem.worldMgr.ecs.addComponent(this.carryItem.entity, new SelectionFrameComponent(pickSphere, stats))
        this.carryItem.targetSurface.fence = this.carryItem.entity
        this.carryItem.targetSurface.fenceRequested = false
        this.carryItem.worldMgr.entityMgr.placedFences.add(this.carryItem)
    }

    assign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) this.fulfiller?.stopJob()
        this.fulfiller = fulfiller
    }

    unAssign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) return
        this.fulfiller = null
    }

    hasFulfiller(): boolean {
        return !!this.fulfiller
    }

    getJobBubble(): keyof BubblesCfg {
        switch (this.carryItem.entityType) {
            case EntityType.ORE:
            case EntityType.BRICK:
                return 'bubbleCarryOre'
            case EntityType.CRYSTAL:
                return 'bubbleCarryCrystal'
            case EntityType.DYNAMITE:
                return 'bubbleCarryDynamite'
            case EntityType.BARRIER:
                return 'bubbleCarryBarrier'
            case EntityType.ELECTRIC_FENCE:
                return 'bubbleCarryElecFence'
        }
    }
}
