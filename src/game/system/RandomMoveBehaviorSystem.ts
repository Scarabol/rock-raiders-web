import { AbstractGameSystem, GameEntity } from '../ECS'
import { RandomMoveComponent } from '../component/RandomMoveComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PositionComponent } from '../component/PositionComponent'
import { SurfaceType } from '../model/map/SurfaceType'

export class RandomMoveBehaviorSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([RandomMoveComponent, PositionComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const randomMoveComponent = components.get(RandomMoveComponent)
                if (randomMoveComponent.isOnIdleTimer(elapsedMs) || components.has(WorldTargetComponent)) continue
                const positionComponent = components.get(PositionComponent)
                if (!positionComponent.isDiscovered()) continue
                const targetSurface = [...positionComponent.surface.neighbors.filter((n) =>
                    (!n.wallType || randomMoveComponent.enterWall)
                    && (!n.surfaceType.floor || randomMoveComponent.crossLand)
                    && (n.surfaceType !== SurfaceType.LAVA5 || randomMoveComponent.crossLava)
                    && (n.surfaceType !== SurfaceType.WATER || randomMoveComponent.crossWater))
                    , positionComponent.surface].random()
                const worldTargetComponent = new WorldTargetComponent()
                worldTargetComponent.position.copy(targetSurface.getRandomPosition())
                worldTargetComponent.radiusSq = 1
                this.ecs.addComponent(entity, worldTargetComponent)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
