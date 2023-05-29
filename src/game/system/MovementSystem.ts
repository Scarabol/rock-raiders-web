import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { NATIVE_UPDATE_INTERVAL } from '../../params'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { HealthComponent } from '../component/HealthComponent'

export class MovementSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([PositionComponent, WorldTargetComponent, MovableStatsComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number) {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const positionComponent = components.get(PositionComponent)
                if (!positionComponent.isDiscovered()) continue
                const worldTargetComponent = components.get(WorldTargetComponent)
                const statsComponent = components.get(MovableStatsComponent)
                const terrain = this.ecs.worldMgr.sceneMgr.terrain
                const targetWorld = terrain.getFloorPosition(worldTargetComponent.position)
                targetWorld.y += positionComponent.floorOffset
                const step = targetWorld.clone().sub(positionComponent.position)
                const entitySpeed = statsComponent.getSpeed(positionComponent.surface.isPath(), positionComponent.surface.hasRubble()) * elapsedMs / NATIVE_UPDATE_INTERVAL
                const entitySpeedSq = entitySpeed * entitySpeed * entitySpeed
                if (targetWorld.distanceToSquared(positionComponent.position) <= entitySpeedSq + worldTargetComponent.radiusSq) {
                    this.ecs.removeComponent(entity, WorldTargetComponent)
                } else if (entitySpeed > 0) {
                    step.clampLength(0, entitySpeed)
                    positionComponent.position.add(step)
                    const nextSurface = terrain.getSurfaceFromWorld(positionComponent.position)
                    if (positionComponent.surface !== nextSurface) {
                        positionComponent.surface = nextSurface
                        if (positionComponent.surface.wallType) {
                            const healthComponent = components.get(HealthComponent)
                            if (healthComponent) healthComponent.kill()
                        }
                    }
                    positionComponent.markDirty()
                } else {
                    console.warn(`Entity ${entity} speed (${entitySpeed}) is zero or less`)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
