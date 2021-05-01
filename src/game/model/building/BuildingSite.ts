import { Vector2 } from 'three'
import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { BarrierActivity } from '../activities/BarrierActivity'
import { Barrier } from '../collect/Barrier'
import { Crystal } from '../collect/Crystal'
import { MaterialEntity } from '../collect/MaterialEntity'
import { Ore } from '../collect/Ore'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { CompletePowerPathJob } from '../job/surface/CompletePowerPathJob'
import { Surface } from '../map/Surface'
import { BuildingEntity } from './BuildingEntity'

export class BuildingSite {

    primarySurface: Surface = null
    secondarySurface: Surface = null
    building: BuildingEntity
    heading: number = 0
    neededByType: Map<EntityType, number> = new Map()
    assignedByType: Map<EntityType, MaterialEntity[]> = new Map()
    onSiteByType: Map<EntityType, MaterialEntity[]> = new Map()
    complete: boolean = false

    constructor(primarySurface: Surface, secondarySurface: Surface = null, building: BuildingEntity = null) {
        this.primarySurface = primarySurface
        this.secondarySurface = secondarySurface
        this.building = building
    }

    getRandomDropPosition(): Vector2 {
        return this.primarySurface.getRandomPosition()
    }

    needs(EntityType: EntityType): boolean {
        const needed = this.neededByType.getOrUpdate(EntityType, () => 0)
        const assigned = this.assignedByType.getOrUpdate(EntityType, () => []).length
        return needed > assigned
    }

    assign(item: MaterialEntity) {
        this.assignedByType.getOrUpdate(item.entityType, () => []).push(item)
    }

    unAssign(item: MaterialEntity) {
        this.assignedByType.getOrUpdate(item.entityType, () => []).remove(item)
    }

    addItem(item: MaterialEntity) {
        const needed = this.neededByType.getOrUpdate(item.entityType, () => 0)
        if (this.onSiteByType.getOrUpdate(item.entityType, () => []).length < needed) {
            item.worldMgr.sceneManager.scene.add(item.group)
            this.onSiteByType.getOrUpdate(item.entityType, () => []).push(item)
            this.checkComplete()
        } else {
            item.resetTarget()
        }
    }

    checkComplete() {
        if (this.complete) return
        this.complete = true
        this.neededByType.forEach((needed, neededType) => {
            this.complete = this.complete && this.onSiteByType.getOrUpdate(neededType, () => []).length >= needed
        })
        if (!this.complete) return
        GameState.buildingSites.remove(this)
        if (!this.building) {
            const items = []
            this.onSiteByType.forEach((itemsOnSite) => items.push(...itemsOnSite))
            EventBus.publishEvent(new JobCreateEvent(new CompletePowerPathJob(this.primarySurface, items)))
        } else {
            this.onSiteByType.getOrUpdate(EntityType.BARRIER, () => []).forEach((item: Barrier) => {
                item.changeActivity(BarrierActivity.Teleport, () => item.removeFromScene())
            })
            this.onSiteByType.getOrUpdate(EntityType.CRYSTAL, () => []).forEach((item: Crystal) => {
                item.removeFromScene()
            })
            this.onSiteByType.getOrUpdate(EntityType.ORE, () => []).forEach((item: Ore) => {
                item.removeFromScene()
            })
            const world = this.primarySurface.getCenterWorld2D()
            this.building.addToScene(this.primarySurface.terrain.worldMgr, world.x, world.y, this.heading + Math.PI / 2, false)
        }
    }

}
