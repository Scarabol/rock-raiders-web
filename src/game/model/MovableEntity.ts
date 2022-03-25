import { MovableEntityStats } from '../../cfg/GameStatsCfg'
import { NATIVE_UPDATE_INTERVAL } from '../../params'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { EntityManager } from '../EntityManager'
import { SceneManager } from '../SceneManager'
import { AnimEntityActivity } from './activities/AnimEntityActivity'
import { EntityStep } from './EntityStep'
import { TerrainPath } from './map/TerrainPath'
import { MoveState } from './MoveState'
import { PathTarget } from './PathTarget'

export abstract class MovableEntity {
    sceneMgr: SceneManager
    entityMgr: EntityManager
    currentPath: TerrainPath = null
    level: number = 0

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
    }

    abstract get sceneEntity(): AnimatedSceneEntity

    abstract get stats(): MovableEntityStats

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
            this.sceneEntity.headTowards(this.currentPath.target.getFocusPoint())
            return MoveState.TARGET_REACHED
        } else {
            this.sceneEntity.headTowards(this.currentPath.firstLocation)
            this.sceneEntity.position.add(step.vec)
            this.sceneEntity.changeActivity(this.getRouteActivity())
            return MoveState.MOVED
        }
    }

    abstract findPathToTarget(target: PathTarget): TerrainPath

    private determineStep(elapsedMs: number): EntityStep {
        const targetWorld = this.sceneMgr.getFloorPosition(this.currentPath.firstLocation)
        targetWorld.y += this.sceneEntity.floorOffset
        const step = new EntityStep(targetWorld.sub(this.sceneEntity.position))
        const stepLengthSq = step.vec.lengthSq()
        const entitySpeed = this.getSpeed() * elapsedMs / NATIVE_UPDATE_INTERVAL // TODO use average speed between current and target position
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

    getRouteActivity(): AnimEntityActivity {
        return AnimEntityActivity.Route
    }

    getSpeed(): number {
        return this.stats.RouteSpeed[this.level] * (this.isOnPath() ? this.stats.PathCoef : 1) * (this.isOnRubble() ? this.stats.RubbleCoef : 1)
    }

    isOnPath(): boolean {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).isPath()
    }

    isOnRubble() {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position).hasRubble()
    }
}
