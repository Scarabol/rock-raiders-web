import { AbstractGameSystem, GameEntity } from '../ECS'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PositionComponent } from '../component/PositionComponent'
import { SurfaceType } from '../terrain/SurfaceType'
import { RandomMoveComponent } from '../component/RandomMoveComponent'
import { HeadingComponent } from '../component/HeadingComponent'

export class RandomMoveBehaviorSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([RandomMoveComponent, PositionComponent, MovableStatsComponent])

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const randomMoveComponent = components.get(RandomMoveComponent)
                if (randomMoveComponent.isOnIdleTimer(elapsedMs) || components.has(WorldTargetComponent)) continue
                const positionComponent = components.get(PositionComponent)
                if (!positionComponent.isDiscovered()) continue
                const statsComponent = components.get(MovableStatsComponent)
                const targetSurface = [...positionComponent.surface.neighbors.filter((n) =>
                    (!n.wallType || statsComponent.enterWall)
                    && (!n.surfaceType.floor || statsComponent.crossLand)
                    && (n.surfaceType !== SurfaceType.LAVA5 || statsComponent.crossLava)
                    && (n.surfaceType !== SurfaceType.WATER || statsComponent.crossWater))
                    , positionComponent.surface].random()
                const targetLocation = targetSurface.getRandomPosition()
                this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation, 1))
                this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
            } catch (e) {
                console.error(e)
            }
        }
    }
}
