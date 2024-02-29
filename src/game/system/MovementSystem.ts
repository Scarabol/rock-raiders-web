import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { NATIVE_UPDATE_INTERVAL } from '../../params'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { AnimEntityActivity } from '../model/anim/AnimationActivity'
import { EntityPushedComponent } from '../component/EntityPushedComponent'
import { HeadingComponent } from '../component/HeadingComponent'
import { WorldManager } from '../WorldManager'

export class MovementSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([PositionComponent, WorldTargetComponent, MovableStatsComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const positionComponent = components.get(PositionComponent)
                if (!positionComponent.isDiscovered()) continue
                const worldTargetComponent = components.get(WorldTargetComponent)
                const statsComponent = components.get(MovableStatsComponent)
                const terrain = this.worldMgr.sceneMgr.terrain
                const targetWorld = terrain.getFloorPosition(worldTargetComponent.position)
                targetWorld.y += positionComponent.floorOffset
                const step = targetWorld.clone().sub(positionComponent.position)
                const entitySpeed = statsComponent.getSpeed(positionComponent.surface.isPath(), positionComponent.surface.hasRubble()) * elapsedMs / NATIVE_UPDATE_INTERVAL
                const sceneEntityComponent = components.get(AnimatedSceneEntityComponent)
                if (targetWorld.distanceToSquared(positionComponent.position) <= worldTargetComponent.radiusSq) {
                    this.ecs.removeComponent(entity, WorldTargetComponent)
                    this.ecs.removeComponent(entity, HeadingComponent)
                    this.ecs.removeComponent(entity, EntityPushedComponent)
                    if (positionComponent.surface.wallType && statsComponent.enterWall) {
                        this.worldMgr.entityMgr.removeEntity(entity)
                        this.ecs.removeEntity(entity)
                        if (sceneEntityComponent) {
                            this.worldMgr.sceneMgr.removeMeshGroup(sceneEntityComponent.sceneEntity)
                            sceneEntityComponent.sceneEntity.dispose()
                        }
                    } else if (sceneEntityComponent) {
                        sceneEntityComponent.sceneEntity.setAnimation(sceneEntityComponent.sceneEntity.carriedByIndex.size > 0 ? AnimEntityActivity.StandCarry : AnimEntityActivity.Stand)
                    }
                } else if (entitySpeed > 0) {
                    step.clampLength(0, entitySpeed)
                    const targetPos = positionComponent.position.clone().add(step)
                    const targetSurface = terrain.getSurfaceFromWorld(targetPos)
                    if (!targetSurface.wallType || statsComponent.enterWall) {
                        positionComponent.position.copy(targetPos)
                        positionComponent.surface = targetSurface
                        positionComponent.markDirty()
                        if (sceneEntityComponent) {
                            sceneEntityComponent.sceneEntity.setAnimation(sceneEntityComponent.sceneEntity.carriedByIndex.size > 0 ? AnimEntityActivity.Carry : AnimEntityActivity.Route)
                        }
                    } else {
                        // TODO Move entity along the wall until there is no other option
                        this.ecs.removeComponent(entity, WorldTargetComponent)
                        this.ecs.removeComponent(entity, HeadingComponent)
                        this.ecs.removeComponent(entity, EntityPushedComponent)
                    }
                } else {
                    console.warn(`Entity ${entity} speed (${entitySpeed}) is zero or less`)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
