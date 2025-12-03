import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PositionComponent } from '../component/PositionComponent'
import { SurfaceType } from '../terrain/SurfaceType'
import { RandomMoveComponent } from '../component/RandomMoveComponent'
import { HeadingComponent } from '../component/HeadingComponent'
import { PRNG } from '../factory/PRNG'

export class RandomMoveBehaviorSystem extends AbstractGameSystem {
    readonly randomMoveCandidates: FilteredEntities = this.addEntityFilter(RandomMoveComponent, PositionComponent, MovableStatsComponent)

    update(ecs: ECS, elapsedMs: number): void {
        for (const [entity, components] of this.randomMoveCandidates) {
            try {
                const randomMoveComponent = components.get(RandomMoveComponent)
                if (randomMoveComponent.isOnIdleTimer(elapsedMs) || components.has(WorldTargetComponent)) continue
                const positionComponent = components.get(PositionComponent)
                if (!positionComponent.isDiscovered()) continue
                const movableComponent = components.get(MovableStatsComponent)
                const targetSurface = PRNG.movement.sample([positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) =>
                    (!n.wallType || movableComponent.stats.randomEnterWall)
                    && (!n.surfaceType.floor || movableComponent.stats.crossLand)
                    && (n.surfaceType !== SurfaceType.LAVA5 || movableComponent.stats.crossLava)
                    && (n.surfaceType !== SurfaceType.WATER || movableComponent.stats.crossWater)
                )])
                const targetLocation = targetSurface.getRandomPosition()
                ecs.addComponent(entity, new WorldTargetComponent(targetLocation, 1))
                ecs.addComponent(entity, new HeadingComponent(targetLocation))
            } catch (e) {
                console.error(e)
            }
        }
    }
}
