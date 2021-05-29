import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { EntityManager } from '../EntityManager'
import { SceneManager } from '../SceneManager'
import { AnimEntityActivity } from './activities/AnimEntityActivity'
import { EntityStep } from './EntityStep'
import { EntityType } from './EntityType'
import { TerrainPath } from './map/TerrainPath'
import { MoveState } from './MoveState'
import { PathTarget } from './PathTarget'

export abstract class MovableEntity {

    sceneMgr: SceneManager
    entityMgr: EntityManager
    entityType: EntityType = null
    currentPath: TerrainPath = null

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
        this.entityType = entityType
    }

    abstract get sceneEntity(): AnimatedSceneEntity

    moveToClosestTarget(target: PathTarget[]): MoveState {
        if (!target || target.length < 1) return MoveState.TARGET_UNREACHABLE
        if (!this.currentPath || !target.some((t) => t.targetLocation.equals(this.currentPath.target.targetLocation))) {
            const paths = target.map((t) => this.findPathToTarget(t)).filter((p) => !!p)
                .sort((l, r) => l.lengthSq - r.lengthSq)
            this.currentPath = paths.length > 0 ? paths[0] : null
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        this.sceneEntity.headTowards(this.currentPath.firstLocation)
        const step = this.determineStep()
        if (step.targetReached) {
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.position.add(step.vec)
            this.sceneEntity.changeActivity(this.getRouteActivity()) // only change when actually moving
            return MoveState.MOVED
        }
    }

    findPathToTarget(target: PathTarget): TerrainPath {
        return new TerrainPath(target, target.targetLocation)
    }

    determineStep(): EntityStep {
        const targetWorld = this.sceneMgr.getFloorPosition(this.currentPath.firstLocation)
        targetWorld.y += this.sceneEntity.floorOffset
        const step = new EntityStep(targetWorld.sub(this.sceneEntity.position))
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.getSpeed() // TODO use average speed between current and target position
        const entitySpeedSq = entitySpeed * entitySpeed
        if (this.currentPath.locations.length > 1) {
            if (stepLengthSq <= entitySpeedSq) {
                this.currentPath.locations.shift()
                return this.determineStep()
            }
        } else if (stepLengthSq <= entitySpeedSq) {
            step.targetReached = true
        }
        step.vec.clampLength(0, entitySpeed)
        return step
    }

    abstract getRouteActivity(): AnimEntityActivity

    getSpeed(): number {
        return this.sceneEntity.animation?.transcoef || 1
    }

}
