import { Vector2, Vector3 } from 'three'
import { EventBus } from '../../event/EventBus'
import { EntityAddedEvent, EntityType, JobCreateEvent } from '../../event/WorldEvents'
import { Building } from '../../game/model/entity/building/Building'
import { GameState } from '../../game/model/GameState'
import { CompletePowerPathJob } from '../../game/model/job/surface/CompletePowerPathJob'
import { BarrierActivity } from './activities/BarrierActivity'
import { BuildingActivity } from './activities/BuildingActivity'
import { BuildingEntity } from './BuildingEntity'
import { CollectableEntity } from './collect/CollectableEntity'
import { CollectableType } from './collect/CollectableType'
import { Surface } from './map/Surface'

export class BuildingSite {

    primarySurface: Surface = null
    secondarySurface: Surface = null
    building: Building
    heading: number = 0
    neededByType: Map<CollectableType, number> = new Map()
    assignedByType: Map<CollectableType, CollectableEntity[]> = new Map()
    onSiteByType: Map<CollectableType, CollectableEntity[]> = new Map()
    complete: boolean = false

    constructor(primarySurface: Surface, secondarySurface: Surface = null, building: Building = null) {
        this.primarySurface = primarySurface
        this.secondarySurface = secondarySurface
        this.building = building
    }

    getRandomDropPosition(): Vector2 {
        return this.primarySurface.getRandomPosition()
    }

    needs(collectableType: CollectableType): boolean {
        const needed = this.neededByType.getOrUpdate(collectableType, () => 0)
        const assigned = this.assignedByType.getOrUpdate(collectableType, () => []).length
        return needed > assigned
    }

    assign(item: CollectableEntity) {
        const collectableType = item.getCollectableType()
        this.assignedByType.getOrUpdate(collectableType, () => []).push(item)
    }

    unAssign(item: CollectableEntity) {
        const collectableType = item.getCollectableType()
        this.assignedByType.getOrUpdate(collectableType, () => []).remove(item)
    }

    addItem(item: CollectableEntity) {
        const collectableType = item.getCollectableType()
        const needed = this.neededByType.getOrUpdate(collectableType, () => 0)
        if (this.onSiteByType.getOrUpdate(collectableType, () => []).length < needed) {
            item.worldMgr.sceneManager.scene.add(item.group)
            this.onSiteByType.getOrUpdate(collectableType, () => []).push(item)
            this.checkComplete()
        } else {
            item.resetTarget()
        }
    }

    checkComplete() {
        if (this.complete) return
        this.complete = true
        this.neededByType.forEach((needed, neededType) => {
            this.complete = this.complete && this.onSiteByType.getOrUpdate(neededType, () => []).length >= this.neededByType.getOrUpdate(neededType, () => 0)
        })
        if (!this.complete) return
        GameState.buildingSites.remove(this)
        if (!this.building) {
            const items = []
            this.onSiteByType.forEach((itemsOnSite) => items.push(...itemsOnSite))
            EventBus.publishEvent(new JobCreateEvent(new CompletePowerPathJob(this.primarySurface, items)))
        } else {
            this.onSiteByType.getOrUpdate(CollectableType.BARRIER, () => []).forEach((item) => {
                item.changeActivity(BarrierActivity.Teleport, () => item.removeFromScene())
            })
            this.onSiteByType.getOrUpdate(CollectableType.CRYSTAL, () => []).forEach((item) => {
                item.removeFromScene()
            })
            this.onSiteByType.getOrUpdate(CollectableType.ORE, () => []).forEach((item) => {
                item.removeFromScene()
            })
            const entity = new BuildingEntity(this.building)
            entity.worldMgr = this.primarySurface.terrain.worldMgr // FIXME refactor this
            entity.changeActivity(BuildingActivity.Teleport, () => {
                entity.createPickSphere()
                GameState.buildings.push(entity)
                entity.turnOnPower()
                EventBus.publishEvent(new EntityAddedEvent(EntityType.BUILDING, entity))
            })
            const world = this.primarySurface.getCenterWorld()
            entity.group.position.set(world.x, entity.worldMgr.getFloorHeight(world.x, world.z), world.z)
            entity.group.rotateOnAxis(new Vector3(0, 1, 0), -this.heading + Math.PI / 2)
            entity.group.visible = entity.worldMgr.sceneManager.terrain.getSurfaceFromWorld(entity.group.position).discovered
            entity.worldMgr.sceneManager.scene.add(entity.group)
        }
    }

}
