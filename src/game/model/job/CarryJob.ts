import { SupervisedJob } from '../../Supervisor'
import { AnimationActivity, DynamiteActivity } from '../anim/AnimationActivity'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { AbstractJob, JobFulfiller } from './Job'
import { PriorityIdentifier } from './PriorityIdentifier'
import { EntityType } from '../EntityType'
import { Barrier } from '../material/Barrier'
import { ElectricFence } from '../material/ElectricFence'
import { Dynamite } from '../material/Dynamite'
import { Brick } from '../material/Brick'
import { Crystal } from '../material/Crystal'
import { Ore } from '../material/Ore'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { ResourceManager } from '../../../resource/ResourceManager'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { DynamiteExplosionEvent } from '../../../event/WorldEvents'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'

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
        this.target = this.findWorkplaces()
            .map((b) => entity.findPathToTarget(b))
            .filter((t) => !!t)
            .sort((l, r) => l.lengthSq - r.lengthSq)[0].target
        return this.target
    }

    private findWorkplaces() {
        switch (this.carryItem.entityType) {
            case EntityType.ORE:
                const ore = this.carryItem as Ore
                const oreSites = ore.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(ore.entityType))
                if (oreSites.length > 0) return oreSites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
                const oreRefineries = ore.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.ORE_REFINERY)
                if (oreRefineries.length > 0) return oreRefineries
                return ore.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
            case EntityType.CRYSTAL:
                const crystal = this.carryItem as Crystal
                const crystalSites = crystal.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(crystal.entityType))
                if (crystalSites.length > 0) return crystalSites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
                const powerStations = crystal.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.POWER_STATION)
                if (powerStations.length > 0) return powerStations
                return crystal.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
            case EntityType.BRICK:
                const brick = this.carryItem as Brick
                const sites = brick.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(brick.entityType))
                if (sites.length > 0) return sites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
                return brick.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
            case EntityType.BARRIER:
                const barrier = this.carryItem as Barrier
                if (barrier.site.complete || barrier.site.canceled) {
                    return barrier.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
                } else {
                    return [PathTarget.fromSite(barrier.site, barrier.location.position, barrier.location.heading)]
                }
            case EntityType.DYNAMITE:
                const dynamite = this.carryItem as Dynamite
                if (dynamite.targetSurface?.isDigable()) {
                    return dynamite.targetSurface.getDigPositions().map((p) => PathTarget.fromLocation(p, dynamite.sceneEntity.getRadiusSquare() / 4))
                } else {
                    return dynamite.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
                }
            case EntityType.ELECTRIC_FENCE:
                const fence = this.carryItem as ElectricFence
                if (!fence.targetSurface.isWalkable()) {
                    return fence.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
                } else {
                    return [PathTarget.fromLocation(fence.targetSurface.getCenterWorld2D())]
                }
        }
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return this.carryItem.priorityIdentifier
    }

    getRequiredTraining(): RaiderTraining {
        return this.carryItem.requiredTraining
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
        this.target.gatherItem(this.carryItem)
        if (this.carryItem.entityType === EntityType.DYNAMITE) this.igniteDynamite()
        else if (this.carryItem.entityType === EntityType.ELECTRIC_FENCE) this.placeFence()
    }

    private igniteDynamite() {
        this.carryItem.sceneEntity.headTowards(this.carryItem.targetSurface.getCenterWorld2D())
        this.carryItem.sceneEntity.changeActivity(DynamiteActivity.TickDown, () => {
            this.carryItem.sceneEntity.disposeFromScene()
            this.carryItem.targetSurface.collapse()
            this.carryItem.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.Explosion, this.carryItem.sceneEntity.position, this.carryItem.sceneEntity.getHeading())
            this.carryItem.sceneEntity.playPositionalAudio(Sample[Sample.SFX_Dynamite], false)
            EventBus.publishEvent(new DynamiteExplosionEvent(this.carryItem.sceneEntity.position2D))
        })
    }

    private placeFence() {
        this.carryItem.sceneEntity.addToScene(null, null)
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
}
