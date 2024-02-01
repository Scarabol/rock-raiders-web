import { Vector2 } from 'three'
import { DeselectAll } from '../../../event/LocalEvents'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { CompleteSurfaceJob } from '../job/surface/CompleteSurfaceJob'
import { Surface } from '../../terrain/Surface'
import { SurfaceType } from '../../terrain/SurfaceType'
import { MaterialEntity } from '../material/MaterialEntity'
import { BuildingEntity } from './BuildingEntity'
import { BuildingType } from './BuildingType'
import { BarrierActivity } from '../anim/AnimationActivity'
import { EventBroker } from '../../../event/EventBroker'

export class BuildingSite {
    surfaces: Surface[] = []
    heading: number = 0
    neededByType: Map<EntityType, number> = new Map()
    assignedByType: Map<EntityType, MaterialEntity[]> = new Map()
    onSiteByType: Map<EntityType, MaterialEntity[]> = new Map()
    complete: boolean = false
    canceled: boolean = false
    placeDownTimer: number = 0
    isEmptyTimer: number = 0

    constructor(readonly worldMgr: WorldManager, readonly primarySurface: Surface, readonly secondarySurface: Surface, readonly primaryPathSurface: Surface, secondaryPathSurface: Surface, readonly buildingType: BuildingType) {
        this.primarySurface.site = this
        this.surfaces.push(this.primarySurface)
        if (this.secondarySurface) {
            this.secondarySurface.site = this
            this.secondarySurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
            this.surfaces.push(this.secondarySurface)
        }
        if (this.primaryPathSurface) {
            this.primaryPathSurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
            this.surfaces.push(this.primaryPathSurface)
        }
        if (secondaryPathSurface) {
            secondaryPathSurface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING)
            this.surfaces.push(secondaryPathSurface)
        }
    }

    static createImproveSurfaceSite(worldMgr: WorldManager, surface: Surface): BuildingSite {
        const site = new BuildingSite(worldMgr, surface, null, null, null, null)
        if (worldMgr.entityMgr.hasBuilding(EntityType.ORE_REFINERY)) {
            site.neededByType.set(EntityType.BRICK, 1)
        } else {
            site.neededByType.set(EntityType.ORE, 2)
        }
        worldMgr.entityMgr.buildingSites.push(site)
        worldMgr.entityMgr.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnMaterials(EntityType.BRICK, 1)
        worldMgr.entityMgr.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnMaterials(EntityType.ORE, 2)
        return site
    }

    getRandomDropPosition(): Vector2 {
        return this.primarySurface.getRandomPosition()
    }

    needs(entityType: EntityType): boolean {
        if (entityType === EntityType.ORE) {
            return this.isNeeded(entityType) && (this.isNeeded(EntityType.BRICK) || this.neededByType.getOrUpdate(EntityType.BRICK, () => 0) < 1)
        } else if (entityType === EntityType.BRICK) {
            return this.isNeeded(entityType) && (this.isNeeded(EntityType.ORE) || this.neededByType.getOrUpdate(EntityType.ORE, () => 0) < 1)
        } else {
            return this.isNeeded(entityType)
        }
    }

    private isNeeded(entityType: EntityType) {
        const needed = this.neededByType.getOrUpdate(entityType, () => 0)
        const assigned = this.assignedByType.getOrUpdate(entityType, () => []).length
        return needed > assigned
    }

    assign(item: MaterialEntity) {
        this.assignedByType.getOrUpdate(item.entityType, () => []).push(item)
    }

    unAssign(item: MaterialEntity) {
        this.assignedByType.getOrUpdate(item.entityType, () => []).remove(item)
    }

    addItem(item: MaterialEntity) {
        this.onSiteByType.getOrUpdate(item.entityType, () => []).push(item)
        this.worldMgr.entityMgr.removeEntity(item.entity)
        this.checkComplete()
    }

    removeItem(item: MaterialEntity) {
        this.unAssign(item)
        this.onSiteByType.getOrUpdate(item.entityType, () => []).remove(item)
    }

    checkComplete() {
        if (this.complete || this.canceled) return
        this.complete = true
        this.neededByType.forEach((needed, neededType) => {
            this.complete = this.complete && this.onSiteByType.getOrUpdate(neededType, () => []).length >= needed
        })
        if (!this.complete) return
        this.worldMgr.entityMgr.buildingSites.remove(this)
        if (!this.buildingType) {
            const items: MaterialEntity[] = []
            this.onSiteByType.forEach((itemsOnSite) => items.push(...itemsOnSite))
            EventBroker.publish(new JobCreateEvent(new CompleteSurfaceJob(this.primarySurface, items)))
        } else {
            this.worldMgr.entityMgr.completedBuildingSites.push(this)
        }
    }

    update(elapsedMs: number) {
        this.placeDownTimer += elapsedMs
        if (this.placeDownTimer < 100) return
        if (this.primarySurface.isBlocked() || this.secondarySurface?.isBlocked()) {
            this.isEmptyTimer = 0
            return
        }
        this.isEmptyTimer += elapsedMs
        if (this.isEmptyTimer < 100) return
        this.teleportIn()
    }

    teleportIn() {
        this.worldMgr.entityMgr.completedBuildingSites.remove(this)
        this.surfaces.forEach((s) => s.site = null)
        this.onSiteByType.forEach((byType: MaterialEntity[]) => byType.forEach((item: MaterialEntity) => {
            if (item.entityType === EntityType.BARRIER) {
                item.sceneEntity.setAnimation(BarrierActivity.Teleport, () => item.disposeFromWorld())
            } else {
                item.disposeFromWorld()
            }
        }))
        new BuildingEntity(this.worldMgr, this.buildingType.entityType) // TODO Refactor power path building site handling
            .placeDown(this.primarySurface.getCenterWorld2D(), -this.heading + Math.PI / 2, false)
    }

    cancelSite() {
        this.worldMgr.entityMgr.buildingSites.remove(this)
        this.canceled = true
        this.surfaces.forEach((s) => {
            s.site = null
            if (s.surfaceType === SurfaceType.POWER_PATH_BUILDING || s.surfaceType === SurfaceType.POWER_PATH_BUILDING_SITE) {
                s.setSurfaceType(SurfaceType.GROUND)
            }
        })
        this.onSiteByType.forEach((materials, entityType) => materials.forEach((item) => {
            if (entityType === EntityType.BARRIER) {
                item.sceneEntity.setAnimation(BarrierActivity.Teleport, () => item.disposeFromWorld())
            } else {
                this.worldMgr.entityMgr.placeMaterial(item, item.getPosition2D())
            }
        }))
        this.onSiteByType.clear()
        this.assignedByType.clear()
        EventBroker.publish(new DeselectAll())
    }

    getWalkOutSurface(): Surface {
        return this.primaryPathSurface || this.primarySurface.neighbors.find((n) => !n.site && n.isWalkable()) ||
            this.secondarySurface?.neighbors.find((n) => !n.site && n.isWalkable())
    }
}
