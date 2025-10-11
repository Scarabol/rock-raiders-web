import { Vector2 } from 'three'
import { DeselectAll } from '../../../event/LocalEvents'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { Surface } from '../../terrain/Surface'
import { SurfaceType } from '../../terrain/SurfaceType'
import { MaterialEntity } from '../material/MaterialEntity'
import { BuildingEntity } from './BuildingEntity'
import { BuildingType } from './BuildingType'
import { BARRIER_ACTIVITY } from '../anim/AnimationActivity'
import { EventBroker } from '../../../event/EventBroker'
import { GameEntity } from '../../ECS'
import { TooltipComponent } from '../../component/TooltipComponent'
import { TooltipSpriteBuilder } from '../../../resource/TooltipSpriteBuilder'

export class BuildingSite {
    entity: GameEntity
    surfaces: Surface[] = []
    heading: number = 0
    neededByType: Map<EntityType, number> = new Map()
    assignedByType: Map<EntityType, MaterialEntity[]> = new Map()
    onSiteByType: Map<EntityType, MaterialEntity[]> = new Map()
    complete: boolean = false
    canceled: boolean = false
    placeDownTimer: number = 0
    isEmptyTimer: number = 0

    constructor(readonly worldMgr: WorldManager, readonly primarySurface: Surface, readonly secondarySurface: Surface | undefined, readonly primaryPathSurface: Surface | undefined, secondaryPathSurface: Surface | undefined, readonly buildingType: BuildingType | undefined) {
        this.entity = this.worldMgr.ecs.addEntity()
        const objectName = this.buildingType?.getObjectName(0)
        if (objectName) {
            this.worldMgr.ecs.addComponent(this.entity, new TooltipComponent(this.entity, objectName, this.buildingType?.getSfxKey() || '', () => {
                return TooltipSpriteBuilder.getBuildingSiteTooltipSprite(objectName, {
                        actual: this.onSiteByType.get(EntityType.CRYSTAL)?.length || 0,
                        needed: this.neededByType.get(EntityType.CRYSTAL) || 0,
                    }, {
                        actual: this.onSiteByType.get(EntityType.ORE)?.length || 0,
                        needed: this.neededByType.get(EntityType.ORE) || 0,
                    }, {
                        actual: this.onSiteByType.get(EntityType.BRICK)?.length || 0,
                        needed: this.neededByType.get(EntityType.BRICK) || 0,
                    },
                )
            }))
        }
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
        const site = new BuildingSite(worldMgr, surface, undefined, undefined, undefined, undefined)
        if (worldMgr.entityMgr.hasBuilding(EntityType.ORE_REFINERY)) {
            site.neededByType.set(EntityType.BRICK, 1)
        } else {
            site.neededByType.set(EntityType.ORE, 2)
        }
        worldMgr.entityMgr.buildingSites.push(site)
        const closestToolstation = worldMgr.entityMgr.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)
        if (closestToolstation) {
            closestToolstation.spawnMaterials(EntityType.BRICK, 1)
            closestToolstation.spawnMaterials(EntityType.ORE, 2)
        }
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
        const event = this.worldMgr.ecs.getComponents(this.entity).get(TooltipComponent)?.createForceRedrawEvent()
        if (event) EventBroker.publish(event)
    }

    removeItem(item: MaterialEntity) {
        this.unAssign(item)
        this.onSiteByType.getOrUpdate(item.entityType, () => []).remove(item)
        const event = this.worldMgr.ecs.getComponents(this.entity).get(TooltipComponent)?.createForceRedrawEvent()
        if (event) EventBroker.publish(event)
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
            this.primarySurface.setupCompleteSurfaceJob()
        } else {
            this.worldMgr.entityMgr.completedBuildingSites.push(this)
        }
    }

    update(elapsedMs: number) {
        if (this.canceled) return
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

    private teleportIn() {
        this.worldMgr.entityMgr.completedBuildingSites.remove(this)
        this.surfaces.forEach((s) => s.site = undefined)
        this.onSiteByType.forEach((byType: MaterialEntity[]) => byType.forEach((item: MaterialEntity) => {
            if (item.entityType === EntityType.BARRIER) {
                item.sceneEntity.setAnimation(BARRIER_ACTIVITY.teleport, () => item.disposeFromWorld())
            } else {
                item.disposeFromWorld()
            }
        }))
        if (this.buildingType) { // TODO Refactor power path building site handling
            new BuildingEntity(this.worldMgr, this.buildingType.entityType, this.primarySurface.getCenterWorld2D(), -this.heading + Math.PI / 2, false)
        }
    }

    cancelSite() {
        this.worldMgr.entityMgr.buildingSites.remove(this)
        this.worldMgr.entityMgr.completedBuildingSites.remove(this)
        this.canceled = true
        this.surfaces.forEach((s) => {
            s.site = undefined
            if (s.surfaceType === SurfaceType.POWER_PATH_BUILDING || s.surfaceType === SurfaceType.POWER_PATH_BUILDING_SITE) {
                s.setSurfaceType(SurfaceType.GROUND)
            }
        })
        this.onSiteByType.forEach((materials, entityType) => materials.forEach((item) => {
            if (entityType === EntityType.BARRIER) {
                item.sceneEntity.setAnimation(BARRIER_ACTIVITY.teleport, () => item.disposeFromWorld())
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
            this.secondarySurface?.neighbors.find((n) => !n.site && n.isWalkable()) || this.primarySurface
    }
}
