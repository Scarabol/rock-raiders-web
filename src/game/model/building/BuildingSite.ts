import { Vector2 } from 'three'
import { EventBus } from '../../../event/EventBus'
import { DeselectAll } from '../../../event/LocalEvents'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { EntityManager } from '../../EntityManager'
import { BarrierActivity } from '../activities/BarrierActivity'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { CompletePowerPathJob } from '../job/surface/CompletePowerPathJob'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { Barrier } from '../material/Barrier'
import { Crystal } from '../material/Crystal'
import { MaterialEntity } from '../material/MaterialEntity'
import { Ore } from '../material/Ore'
import { BuildingEntity } from './BuildingEntity'

export class BuildingSite {

    entityMgr: EntityManager
    primarySurface: Surface = null
    secondarySurface: Surface = null
    primaryPathSurface: Surface = null
    surfaces: Surface[] = []
    building: BuildingEntity
    heading: number = 0
    neededByType: Map<EntityType, number> = new Map()
    assignedByType: Map<EntityType, MaterialEntity[]> = new Map()
    onSiteByType: Map<EntityType, MaterialEntity[]> = new Map()
    complete: boolean = false
    canceled: boolean = false

    constructor(entityMgr: EntityManager, primarySurface: Surface, secondarySurface: Surface, primaryPathSurface: Surface, secondaryPathSurface: Surface, building: BuildingEntity) {
        this.entityMgr = entityMgr
        this.primarySurface = primarySurface
        this.primarySurface.setSite(this)
        this.surfaces.push(this.primarySurface)
        this.secondarySurface = secondarySurface
        if (this.secondarySurface) {
            this.secondarySurface.setSite(this)
            this.surfaces.push(this.secondarySurface)
        }
        this.primaryPathSurface = primaryPathSurface
        this.primaryPathSurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
        this.surfaces.push(this.primaryPathSurface)
        if (secondaryPathSurface) {
            secondaryPathSurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
            this.surfaces.push(secondaryPathSurface)
        }
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
            item.onAddToSite()
            this.onSiteByType.getOrUpdate(item.entityType, () => []).push(item)
            this.checkComplete()
        } else {
            item.resetTarget()
        }
    }

    checkComplete() {
        if (this.complete || this.canceled) return
        this.complete = true
        this.neededByType.forEach((needed, neededType) => {
            this.complete = this.complete && this.onSiteByType.getOrUpdate(neededType, () => []).length >= needed
        })
        if (!this.complete) return
        this.entityMgr.buildingSites.remove(this)
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
            this.building.placeDown(world, -this.heading + Math.PI / 2, false)
        }
    }

    getDropAction(): RaiderActivity {
        return RaiderActivity.Place
    }

    cancelSite() {
        this.entityMgr.buildingSites.remove(this)
        this.canceled = true
        this.surfaces.forEach((s) => s?.setSite(null))
        this.onSiteByType.forEach((materials) => materials.forEach((item) => {
            this.entityMgr.placeMaterial(item, item.getPosition2D())
        }))
        this.onSiteByType.clear()
        this.assignedByType.forEach((materials) => materials.forEach((item) => {
            item.resetTarget()
        }))
        this.assignedByType.clear()
        EventBus.publishEvent(new DeselectAll())
    }

    getWalkOutSurface(): Surface {
        return this.primaryPathSurface || this.primarySurface.neighbors.find((n) => !n.site && n.isWalkable()) ||
            this.secondarySurface?.neighbors.find((n) => !n.site && n.isWalkable())
    }

}
