import { AnimationActivity, AnimEntityActivity, BarrierActivity, BuildingActivity, DynamiteActivity, RaiderActivity } from '../anim/AnimationActivity'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { Job, JobFulfiller } from './Job'
import { EntityType } from '../EntityType'
import { Raider } from '../raider/Raider'
import { DynamiteExplosionEvent } from '../../../event/WorldEvents'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../../component/SelectionFrameComponent'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { EntityManager } from '../../EntityManager'
import { SelectionChanged } from '../../../event/LocalEvents'
import { RaiderScareComponent, RaiderScareRange } from '../../component/RaiderScareComponent'
import { MaterialSpawner } from '../../factory/MaterialSpawner'
import { JobState } from './JobState'
import { GameConfig } from '../../../cfg/GameConfig'
import { EventBroker } from '../../../event/EventBroker'
import { Vector2 } from 'three'

export class CarryJob extends Job {
    fulfiller?: JobFulfiller
    target?: PathTarget

    constructor(readonly carryItem: MaterialEntity) {
        super()
        this.requiredTraining = this.carryItem.requiredTraining
        this.priorityIdentifier = this.carryItem.priorityIdentifier
        this.workSoundRaider = 'SFX_Place'
        const carriedEntityType = this.carryItem.entityType
        if (carriedEntityType === EntityType.ORE || carriedEntityType === EntityType.BRICK) {
            this.workSoundRaider = 'SFX_PlaceOre'
        } else if (carriedEntityType === EntityType.CRYSTAL) {
            this.workSoundRaider = 'SFX_PlaceCrystal'
        }
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (this.target && !(
            (this.target.building && !this.target.building.isPowered()) ||
            (this.target.site && (this.target.site.complete || this.target.site.canceled)) ||
            (this.carryItem.targetSurface && this.carryItem.targetSurface.dynamiteJob !== this) ||
            !entity.findShortestPath(this.target)
        )) {
            return this.target
        }
        if (this.target?.site) this.target.site.unAssign(this.carryItem)
        this.target = entity.findShortestPath(this.findWorkplaces(entity))?.target
        if (this.target?.site) this.target.site.assign(this.carryItem)
        return this.target
    }

    private findWorkplaces(entity: JobFulfiller): PathTarget[] {
        const carryItem = this.carryItem
        const entityMgr = carryItem.worldMgr.entityMgr
        switch (carryItem.entityType) {
            case EntityType.ORE:
                const oreSites = this.findReachableBuildingSiteWithNeed(entityMgr, carryItem, entity)
                if (oreSites.length > 0) return oreSites
                const oreRefineries = this.findReachableBuilding(entityMgr, EntityType.ORE_REFINERY, entity)
                if (oreRefineries.length > 0) return oreRefineries
                return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
            case EntityType.CRYSTAL:
                const crystalSites = this.findReachableBuildingSiteWithNeed(entityMgr, carryItem, entity)
                if (crystalSites.length > 0) return crystalSites
                const powerStations = this.findReachableBuilding(entityMgr, EntityType.POWER_STATION, entity)
                if (powerStations.length > 0) return powerStations
                return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
            case EntityType.DEPLETED_CRYSTAL:
                return this.carryItem.worldMgr.sceneMgr.terrain.rechargeSeams
                    .flatMap((s) => s.getDigPositions()
                        .map((p) => PathTarget.fromLocation(p, 1, s.getCenterWorld2D()))
                    )
            case EntityType.BRICK:
                const sites = this.findReachableBuildingSiteWithNeed(entityMgr, carryItem, entity)
                if (sites.length > 0) return sites
                return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
            case EntityType.BARRIER:
                if (!carryItem.targetSite || carryItem.targetSite.complete || carryItem.targetSite.canceled) {
                    return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
                } else {
                    const targetCenter = carryItem.worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(carryItem.location).getCenterWorld2D()
                    const focusPoint = carryItem.location.clone().add(new Vector2().copy(carryItem.location).sub(targetCenter))
                    return [PathTarget.fromSite(carryItem.targetSite, carryItem.location, focusPoint)].filter((p) => !!entity.findShortestPath(p))
                }
            case EntityType.DYNAMITE:
                if (carryItem.targetSurface?.isDigable() && carryItem.targetSurface?.dynamiteJob === this) {
                    const pickupRadius = carryItem.worldMgr.ecs.getComponents(carryItem.entity).get(SceneSelectionComponent)?.stats.pickSphere || 1
                    return carryItem.targetSurface.getDigPositions()
                        .map((p) => PathTarget.fromLocation(p, pickupRadius * pickupRadius))
                        .filter((p) => !!entity.findShortestPath(p))
                } else {
                    return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
                }
            case EntityType.ELECTRIC_FENCE:
                if (!carryItem.targetSurface?.isWalkable()) {
                    return this.findReachableBuilding(entityMgr, EntityType.TOOLSTATION, entity)
                } else {
                    return [PathTarget.fromLocation(carryItem.targetSurface.getCenterWorld2D(), 25)].filter((p) => !!entity.findShortestPath(p))
                }
        }
    }

    private findReachableBuildingSiteWithNeed(entityMgr: EntityManager, carryItem: MaterialEntity, entity: JobFulfiller) {
        return entityMgr.buildingSites
            .filter((b) => b.needs(carryItem.entityType))
            .map((s) => PathTarget.fromSite(s, s.getRandomDropPosition(), undefined))
            .filter((p) => !!entity.findShortestPath(p))
    }

    private findReachableBuilding(entityMgr: EntityManager, buildingType: EntityType, entity: JobFulfiller) {
        return entityMgr.getBuildingCarryPathTargets(buildingType).filter((p) => !!entity.findShortestPath(p))
    }

    getWorkActivity(): AnimationActivity {
        if (this.fulfiller?.entityType === EntityType.PILOT) {
            if (this.carryItem.entityType === EntityType.DEPLETED_CRYSTAL) return RaiderActivity.Recharge
            const building = this.target?.building?.entityType
            return building === EntityType.POWER_STATION || building === EntityType.ORE_REFINERY ? RaiderActivity.Deposit : RaiderActivity.Place
        }
        return AnimEntityActivity.Stand
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
        const dropped = this.fulfiller?.dropCarried(false) || []
        dropped.forEach((droppedItem) => {
            droppedItem.carryJob.jobState = JobState.COMPLETE
            if (this.target) droppedItem.setPosition(droppedItem.worldMgr.sceneMgr.getFloorPosition(this.target.targetLocation))
            const targetBuilding = this.target?.building
            if (targetBuilding) {
                if (targetBuilding.entityType === EntityType.POWER_STATION || targetBuilding.entityType === EntityType.ORE_REFINERY) {
                    targetBuilding.pickupItem(droppedItem)
                    if (targetBuilding.sceneEntity.carriedByIndex.size >= targetBuilding.getMaxCarry()) {
                        targetBuilding.sceneEntity.setAnimation(BuildingActivity.Deposit, () => {
                            targetBuilding.sceneEntity.setAnimation(targetBuilding.isPowered() ? BuildingActivity.Stand : BuildingActivity.Unpowered)
                            targetBuilding.sceneEntity.removeAllCarried()
                            targetBuilding.depositItems()
                        })
                    }
                } else {
                    droppedItem.worldMgr.depositItem(droppedItem)
                    droppedItem.disposeFromWorld()
                }
            } else if (droppedItem.entityType === EntityType.DEPLETED_CRYSTAL) {
                droppedItem.disposeFromWorld()
                const material = MaterialSpawner.spawnMaterial(droppedItem.worldMgr, EntityType.CRYSTAL, droppedItem.getPosition2D())
                const raider = fulfiller as Raider // XXX refactor type safety for jobs
                raider.setJob(material.carryJob)
                raider.carries = material
                raider.sceneEntity.pickupEntity(material.sceneEntity)
            } else if (droppedItem.entityType === EntityType.ELECTRIC_FENCE) {
                droppedItem.worldMgr.entityMgr.removeEntity(droppedItem.entity)
                droppedItem.worldMgr.sceneMgr.addSceneEntity(droppedItem.sceneEntity)
                droppedItem.sceneEntity.rotation.set(0, 0, 0)
                const stats = GameConfig.instance.stats.electricFence
                const pickSphere = droppedItem.worldMgr.ecs.getComponents(droppedItem.entity).get(SceneSelectionComponent).pickSphere
                droppedItem.worldMgr.ecs.addComponent(droppedItem.entity, new SelectionFrameComponent(pickSphere, stats))
                droppedItem.targetSurface.fence = droppedItem.entity
                droppedItem.targetSurface.fenceRequested = false
                droppedItem.worldMgr.entityMgr.placedFences.add(droppedItem)
                const neighborsFence = droppedItem.targetSurface.neighborsFence
                if (neighborsFence.some((s) => s.selected)) EventBroker.publish(new SelectionChanged(droppedItem.worldMgr.entityMgr))
            } else if (droppedItem.entityType === EntityType.DYNAMITE) {
                if (droppedItem.targetSurface?.dynamiteJob === this) this.igniteDynamite()
            } else {
                droppedItem.sceneEntity.addToScene(droppedItem.worldMgr.sceneMgr, undefined, undefined)
                if (droppedItem.entityType === EntityType.BARRIER) {
                    droppedItem.sceneEntity.setAnimation(BarrierActivity.Expand, () => droppedItem.sceneEntity.setAnimation(BarrierActivity.Long))
                    droppedItem.sceneEntity.lookAt(droppedItem.getSurface().getCenterWorld())
                }
                this.target?.site?.addItem(droppedItem)
            }
        })
    }

    private igniteDynamite() {
        this.carryItem.worldMgr.ecs.addComponent(this.carryItem.entity, new RaiderScareComponent(RaiderScareRange.DYNAMITE))
        this.carryItem.sceneEntity.headTowards(this.carryItem.targetSurface.getCenterWorld2D())
        this.carryItem.sceneEntity.setAnimation(DynamiteActivity.TickDown, () => {
            this.carryItem.worldMgr.ecs.removeComponent(this.carryItem.entity, RaiderScareComponent)
            this.carryItem.targetSurface.collapse()
            this.carryItem.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.explosion, this.carryItem.getPosition(), this.carryItem.sceneEntity.heading, false)
            EventBroker.publish(new DynamiteExplosionEvent(this.carryItem.getPosition2D()))
            this.carryItem.disposeFromWorld()
        })
    }

    assign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) this.fulfiller?.stopJob()
        this.fulfiller = fulfiller
    }

    unAssign(fulfiller: JobFulfiller) {
        if (this.fulfiller !== fulfiller) return
        this.fulfiller = undefined
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
            case EntityType.DEPLETED_CRYSTAL:
                return 'bubbleRecharge'
            case EntityType.DYNAMITE:
                return 'bubbleCarryDynamite'
            case EntityType.BARRIER:
                return 'bubbleCarryBarrier'
            case EntityType.ELECTRIC_FENCE:
                return 'bubbleCarryElecFence'
        }
    }
}
