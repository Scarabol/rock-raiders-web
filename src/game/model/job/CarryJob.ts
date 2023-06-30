import { SupervisedJob } from '../../Supervisor'
import { AnimationActivity, DynamiteActivity } from '../anim/AnimationActivity'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTraining, RaiderTrainings } from '../raider/RaiderTraining'
import { AbstractJob, JobFulfiller } from './Job'
import { PriorityIdentifier, priorityIdentifierFromMaterialType } from './PriorityIdentifier'
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

export class CarryJob extends AbstractJob implements SupervisedJob {
    fulfiller: JobFulfiller = null
    target: PathTarget

    constructor(readonly carryItem: MaterialEntity) {
        super()
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (this.target && !this.target?.isInvalid()) {
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
                    return [PathTarget.fromSite(this.carryItem.targetSite, this.carryItem.location.position, this.carryItem.location.heading)]
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

    getPriorityIdentifier(): PriorityIdentifier {
        return priorityIdentifierFromMaterialType(this.carryItem.entityType)
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTrainings.fromMaterialEntityType(this.carryItem.entityType)
    }

    getWorkActivity(): AnimationActivity {
        return this.target?.getDropAction()
    }

    isReadyToComplete(): boolean {
        return !!(this.target?.canGatherItem())
    }

    onJobComplete() {
        super.onJobComplete()
        this.fulfiller.sceneEntity.headTowards(this.target.targetLocation)
        this.fulfiller.dropCarried()
        this.carryItem.sceneEntity.position.copy(this.carryItem.worldMgr.sceneMgr.getFloorPosition(this.target.targetLocation))
        this.carryItem.worldMgr.ecs.getComponents(this.carryItem.entity).get(PositionComponent).position.copy(this.carryItem.sceneEntity.position)
        this.target.gatherItem(this.carryItem)
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
        this.fulfiller = fulfiller
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
