import { MovementGameComponent } from '../common/MovementGameComponent'
import { PathTarget } from '../../model/PathTarget'
import { MoveState } from '../../model/MoveState'
import { TerrainPath } from '../../model/map/TerrainPath'
import { EntityStep } from '../../model/EntityStep'
import { NATIVE_UPDATE_INTERVAL } from '../../../params'
import { AnimatedSceneEntityComponent } from '../common/AnimatedSceneEntityComponent'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { MovableEntityStatsComponent } from '../common/MovableEntityStatsComponent'
import { Terrain } from '../../model/map/Terrain'

export abstract class MonsterMovementComponent extends MovementGameComponent {
    sceneEntity: AnimatedSceneEntityComponent
    movable: MovableEntityStatsComponent
    terrain: Terrain = null
    currentPath: TerrainPath = null

    setupComponent(entity: AbstractGameEntity) {
        super.setupComponent(entity)
        this.sceneEntity = entity.getComponent(AnimatedSceneEntityComponent)
        this.movable = entity.getComponent(MovableEntityStatsComponent)
        this.terrain = entity.worldMgr.sceneMgr.terrain
    }

    abstract findPathToTarget(target: PathTarget): TerrainPath

    moveToClosestTarget(target: PathTarget[], elapsedMs: number): MoveState {
        if (!target || target.length < 1) return MoveState.TARGET_UNREACHABLE
        if (!this.currentPath || !target.some((t) => t.targetLocation.equals(this.currentPath.target.targetLocation))) {
            const paths = target.map((t) => this.findPathToTarget(t)).filter((p) => !!p)
                .sort((l, r) => l.lengthSq - r.lengthSq)
            this.currentPath = paths.length > 0 ? paths[0] : null
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        const step = this.determineStep(elapsedMs)
        if (step.targetReached) {
            this.sceneEntity.focus(this.currentPath.target.getFocusPoint())
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.focus(this.currentPath.firstLocation)
            this.sceneEntity.move(step.vec) // TODO rotate spider according to surface normal vector
            return MoveState.MOVED
        }
    }

    private determineStep(elapsedMs: number): EntityStep {
        const worldDistance = this.sceneEntity.getWorldDistance(this.currentPath.firstLocation)
        const step = new EntityStep(worldDistance)
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.movable.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL // TODO use average speed between current and target position
        const entitySpeedSq = entitySpeed * entitySpeed
        if (this.currentPath.locations.length > 1) {
            if (stepLengthSq <= entitySpeedSq) {
                this.currentPath.locations.shift()
                return this.determineStep(elapsedMs)
            }
        } else if (stepLengthSq <= entitySpeedSq + this.currentPath.target.radiusSq) {
            step.targetReached = true
        }
        step.vec.clampLength(0, entitySpeed)
        return step
    }
}
