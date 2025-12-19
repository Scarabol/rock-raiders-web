import { AbstractGameSystem, ECS, FilteredEntities, GameEntity } from '../ECS'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { NATIVE_UPDATE_INTERVAL, TILESIZE } from '../../params'
import { TinyRockMonsterBehaviorComponent, TinyRockMonsterBehaviorState } from '../component/TinyRockMonsterBehaviorComponent'
import { Vector2, Vector3 } from 'three'
import { WorldManager } from '../WorldManager'
import { PositionComponent } from '../component/PositionComponent'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { MovableEntityStats } from '../../cfg/GameStatsCfg'
import { PathFinder } from '../terrain/PathFinder'
import { PRNG } from '../factory/PRNG'
import { PathTarget } from '../model/PathTarget'
import { EntityStep } from '../model/EntityStep'
import { MOVE_STATE, MoveState } from '../model/MoveState'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { TerrainPath } from '../terrain/TerrainPath'
import { Surface } from '../terrain/Surface'
import { TINY_ROCK_MONSTER_ACTIVITY } from '../model/anim/AnimationActivity'
import { WALL_TYPE } from '../terrain/WallType'

const PATH_PRECISION = 3

class StateUpdater {
    constructor(
        readonly worldMgr: WorldManager,
        public entity: GameEntity,
        public sceneEntity: AnimatedSceneEntity,
        public positionComponent: PositionComponent,
        public behaviorComponent: TinyRockMonsterBehaviorComponent,
        public stats: MovableEntityStats,
    ) {
    }

    findShortestPath(target: PathTarget) {
        return this.worldMgr.sceneMgr.terrain.pathFinder.findShortestPath(this.getPosition2D(), target, this.stats, PATH_PRECISION, this.behaviorComponent.currentPath?.target.targetLocation)
    }

    moveToClosestTarget(target: PathTarget | undefined, elapsedMs: number): MoveState {
        if (!target) return MOVE_STATE.targetUnreachable
        let pathUpdated = false
        if (!this.behaviorComponent.currentPath || !target.targetLocation.equals(this.behaviorComponent.currentPath.target.targetLocation)) {
            const path = this.findShortestPath(target)
            this.behaviorComponent.currentPath = path && path.locations.length > 0 ? path : undefined
            if (!path) return MOVE_STATE.targetUnreachable
            path.locations.forEach((l, index) => {
                if (index < path.locations.length - 1) l.add(new Vector2().random().subScalar(0.5).multiplyScalar(TILESIZE / PATH_PRECISION))
            })
            pathUpdated = true
        }
        const step = this.determineStep(elapsedMs, this.behaviorComponent.currentPath!)
        if (step.targetReached) {
            return MOVE_STATE.targetReached
        }
        if (!pathUpdated) {
            const currentSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(this.getPosition())
            const nextSurface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(step.position)
            if (this.canTraverse(currentSurface) && !this.canTraverse(nextSurface)) {
                // Recalculate path when running into obstacle
                this.behaviorComponent.currentPath = undefined
                return this.moveToClosestTarget(target, elapsedMs)
            }
        }
        this.setPosition(step.position)
        this.sceneEntity.headTowards(step.focusPoint)
        this.sceneEntity.setAnimation(TINY_ROCK_MONSTER_ACTIVITY.route)
        return MOVE_STATE.moved
    }

    determineStep(elapsedMs: number, currentPath: TerrainPath): EntityStep {
        const stepLength = this.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL
        const maxTurn = 2 * Math.PI * stepLength / TILESIZE * PATH_PRECISION
        const pos = this.getPosition2D()
        const dir3d = new Vector3(0, 0, 1).applyQuaternion(this.sceneEntity.quaternion)
        const dir = new Vector2(dir3d.x, dir3d.z)
        const step = currentPath.step(pos, dir, stepLength, maxTurn)
        const targetWorld = this.worldMgr.sceneMgr.getFloorPosition(step.position)
        targetWorld.y += this.positionComponent.floorOffset
        return new EntityStep(targetWorld, step.position.clone().add(step.direction), stepLength - step.remainingStepLength, step.targetReached)
    }

    getSpeed(): number {
        const currentSurface = this.getSurface()
        const pathMultiplier = currentSurface.isPath() ? this.stats.pathCoef : 1
        const rubbleMultiplier = currentSurface.hasRubble() ? this.stats.rubbleCoef : 1
        return this.stats.routeSpeed[0] * pathMultiplier * rubbleMultiplier
    }

    canTraverse(surface: Surface): boolean {
        return PathFinder.getWeight(
            this.worldMgr.sceneMgr.terrain.pathFinder.surfaces[surface.x][surface.y],
            this.stats,
        ) > 0
    }

    getPosition(): Vector3 {
        return this.positionComponent.position.clone()
    }

    getPosition2D(): Vector2 {
        return this.positionComponent.getPosition2D()
    }

    setPosition(position: Vector3) {
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(position)
        this.positionComponent.position.copy(position)
        this.positionComponent.surface = surface
        this.positionComponent.markDirty()
    }

    getSurface(): Surface {
        return this.positionComponent.surface
    }

    findEnterWall(): { target: PathTarget, wall: Surface } | undefined {
        const toCheck = [this.getSurface()]
        const checked = new Set(toCheck)
        while (toCheck.length > 0) {
            const current = toCheck.shift()!
            for (const next of current.neighbors) {
                if (checked.has(next)) {
                    continue
                }
                if (this.canTraverse(next)) {
                    toCheck.push(next)
                    checked.add(next)
                }
                if (!this.canTraverse(current)) {
                    continue
                }
                if (next.wallType === WALL_TYPE.wall && next.surfaceType.digable) {
                    return {
                        target: PathTarget.fromLocation(
                            current.getCenterWorld2D()
                                .multiplyScalar(0.51)
                                .addScaledVector(next.getCenterWorld2D(), 0.49),
                            -1,
                            next.getCenterWorld2D(),
                        ),
                        wall: next,
                    }
                }
            }
        }
        return undefined
    }

    update(elapsedMs: number) {
        let target = this.behaviorComponent.currentPath?.target
        if (!target) {
            if (this.behaviorComponent.state === TinyRockMonsterBehaviorState.PANIC) {
                const surface = this.getSurface()
                const targetSurface = PRNG.movement.sample(surface.neighbors.filter((s) => PathFinder.getWeight(s, this.stats) !== 0))
                    ?? surface
                target = PathTarget.fromLocation(targetSurface.getRandomPosition(), 0)
            } else if (this.behaviorComponent.state === TinyRockMonsterBehaviorState.GOTO_WALL) {
                const wallTarget = this.findEnterWall()
                target = wallTarget?.target
                this.behaviorComponent.wall = wallTarget?.wall
            }
        }
        const move = this.moveToClosestTarget(target, elapsedMs)
        if (move === MOVE_STATE.moved) {
            return
        }
        this.behaviorComponent.currentPath = undefined
        if (move === MOVE_STATE.targetReached) {
            this.behaviorComponent.state += 1
        }
        if (this.behaviorComponent.state === TinyRockMonsterBehaviorState.ENTER_WALL) {
            if (this.behaviorComponent.wall?.wallType !== WALL_TYPE.wall) {
                this.behaviorComponent.state = TinyRockMonsterBehaviorState.GOTO_WALL
                return
            }
            this.sceneEntity.setAnimation(TINY_ROCK_MONSTER_ACTIVITY.enter, () => {
                this.worldMgr.entityMgr.removeEntity(this.entity)
                this.worldMgr.ecs.removeEntity(this.entity)
                this.worldMgr.sceneMgr.disposeSceneEntity(this.sceneEntity)
            })
        } else if (move === MOVE_STATE.targetUnreachable) {
            this.behaviorComponent.state = TinyRockMonsterBehaviorState.PANIC
        }
    }
}

export class TinyRockMonsterBehaviorSystem extends AbstractGameSystem {
    readonly tinyRockMonsters: FilteredEntities = this.addEntityFilter(TinyRockMonsterBehaviorComponent, PositionComponent, MovableStatsComponent, AnimatedSceneEntityComponent)

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(_ecs: ECS, elapsedMs: number): void {
        for (const [entity, components] of this.tinyRockMonsters) {
            try {
                new StateUpdater(
                    this.worldMgr,
                    entity,
                    components.get(AnimatedSceneEntityComponent).sceneEntity,
                    components.get(PositionComponent),
                    components.get(TinyRockMonsterBehaviorComponent),
                    components.get(MovableStatsComponent).stats,
                ).update(elapsedMs)
            } catch (e) {
                console.error(e)
            }
        }
    }
}
