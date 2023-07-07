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
import { EntityManager } from '../../EntityManager'

export class CarryJob extends Job {
    fulfiller: JobFulfiller = null
    target: PathTarget

    constructor(readonly carryItem: MaterialEntity) {
        super()
        this.requiredTraining = this.carryItem.requiredTraining
        this.priorityIdentifier = this.carryItem.priorityIdentifier
        this.workSoundRaider = Sample.SFX_Place
        const carriedEntityType = this.carryItem.entityType
        if (carriedEntityType === EntityType.ORE || carriedEntityType === EntityType.BRICK) {
            this.workSoundRaider = Sample.SFX_PlaceOre
        } else if (carriedEntityType === EntityType.CRYSTAL) {
            this.workSoundRaider = Sample.SFX_PlaceCrystal
        }
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (this.target && !(
            (this.target.building && !this.target.building.isPowered()) ||
            (this.target.site && (this.target.site.complete || this.target.site.canceled))
        )) {
            return this.target
        }
        if (this.target?.site) this.target.site.unAssign(this.carryItem)
        this.target = entity.findShortestPath(this.findWorkplaces(entity))?.target
        if (this.target?.site) this.target.site.assign(this.carryItem)
        return this.target
    }

    private findWorkplaces(entity: Raider | VehicleEntity) {
        const carryItem = this.carryItem
        const entityMgr = carryItem.worldMgr.entityMgr
        switch (carryItem.entityType) {
            case EntityType.ORE:
                const oreSites = this.findReachableBuildingSiteWithNeed(entityMgr, carryItem, entity)
                if (oreSites.length > 0) return oreSites
                const oreRefineries = entityMgr.getBuildingCarryPathTargets(EntityType.ORE_REFINERY)
                if (oreRefineries.length > 0) return oreRefineries
                return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
            case EntityType.CRYSTAL:
                const crystalSites = this.findReachableBuildingSiteWithNeed(entityMgr, carryItem, entity)
                if (crystalSites.length > 0) return crystalSites
                const powerStations = entityMgr.getBuildingCarryPathTargets(EntityType.POWER_STATION)
                if (powerStations.length > 0) return powerStations
                return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
            case EntityType.BRICK:
                const sites = this.findReachableBuildingSiteWithNeed(entityMgr, carryItem, entity)
                if (sites.length > 0) return sites
                return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
            case EntityType.BARRIER:
                if (carryItem.targetSite.complete || carryItem.targetSite.canceled) {
                    return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
                } else {
                    return [PathTarget.fromSite(carryItem.targetSite, carryItem.location)].filter((p) => !!entity.findShortestPath(p))
                }
            case EntityType.DYNAMITE:
                if (carryItem.targetSurface?.isDigable()) {
                    return carryItem.targetSurface.getDigPositions()
                        .map((p) => PathTarget.fromLocation(p, carryItem.sceneEntity.getRadiusSquare() / 4))
                        .filter((p) => !!entity.findShortestPath(p))
                } else {
                    return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
                }
            case EntityType.ELECTRIC_FENCE:
                if (!carryItem.targetSurface.isWalkable()) {
                    return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
                } else {
                    return [PathTarget.fromLocation(carryItem.targetSurface.getCenterWorld2D())].filter((p) => !!entity.findShortestPath(p))
                }
        }
    }

    private findReachableBuildingSiteWithNeed(entityMgr: EntityManager, carryItem: MaterialEntity, entity: Raider | VehicleEntity) {
        return entityMgr.buildingSites
            .filter((b) => b.needs(carryItem.entityType))
            .map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
            .filter((p) => !!entity.findShortestPath(p))
    }

    private findReachableBuilding(entityMgr: EntityManager, buildingType: EntityType, entity: Raider | VehicleEntity) {
        return entityMgr.getBuildingCarryPathTargets(buildingType).filter((p) => !!entity.findShortestPath(p))
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
        this.carryItem.setPosition(this.carryItem.worldMgr.sceneMgr.getFloorPosition(this.target.targetLocation))
        if (this.target.building) {
            if (this.target.building.entityType === EntityType.POWER_STATION || this.target.building.entityType === EntityType.ORE_REFINERY) {
                this.target.building.pickupItem(this.carryItem)
                if (this.target.building.sceneEntity.carriedByIndex.size >= this.target.building.getMaxCarry()) {
                    this.target.building.sceneEntity.setAnimation(BuildingActivity.Deposit, () => {
                        this.target.building.sceneEntity.setAnimation(this.target.building.isPowered() ? BuildingActivity.Stand : BuildingActivity.Unpowered)
                        this.target.building.sceneEntity.removeAllCarried()
                        this.target.building.carriedItems.forEach((carried) => {
                            const floorPosition = carried.worldMgr.sceneMgr.terrain.getFloorPosition(carried.getPosition2D())
                            carried.setPosition(floorPosition)
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
                this.carryItem.sceneEntity.lookAt(this.carryItem.getSurface().getCenterWorld())
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
            this.carryItem.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.Explosion, this.carryItem.getPosition(), this.carryItem.sceneEntity.heading, false)
            EventBus.publishEvent(new DynamiteExplosionEvent(this.carryItem.getPosition2D()))
            this.carryItem.disposeFromWorld()
        })
    }

    private placeFence() {
        this.carryItem.worldMgr.sceneMgr.addMeshGroup(this.carryItem.sceneEntity)
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
