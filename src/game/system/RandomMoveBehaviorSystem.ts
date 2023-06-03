import { AbstractGameSystem, GameEntity } from '../ECS'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PositionComponent } from '../component/PositionComponent'
import { SurfaceType } from '../terrain/SurfaceType'

export class RandomMoveBehaviorSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([MovableStatsComponent, PositionComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const moveComponent = components.get(MovableStatsComponent)
                if (moveComponent.isOnIdleTimer(elapsedMs) || components.has(WorldTargetComponent)) continue
                const positionComponent = components.get(PositionComponent)
                if (!positionComponent.isDiscovered()) continue
                const targetSurface = [...positionComponent.surface.neighbors.filter((n) =>
                    (!n.wallType || moveComponent.enterWall)
                    && (!n.surfaceType.floor || moveComponent.crossLand)
                    && (n.surfaceType !== SurfaceType.LAVA5 || moveComponent.crossLava)
                    && (n.surfaceType !== SurfaceType.WATER || moveComponent.crossWater))
                    , positionComponent.surface].random()
                const worldTargetComponent = new WorldTargetComponent(targetSurface.getRandomPosition(), 1)
                this.ecs.addComponent(entity, worldTargetComponent)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
