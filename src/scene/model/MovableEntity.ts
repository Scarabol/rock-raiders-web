import { AnimEntity } from './anim/AnimEntity'
import { Vector2, Vector3 } from 'three'
import { AnimationEntityType } from './anim/AnimationEntityType'
import { BaseActivity } from './activities/BaseActivity'
import { MovableEntityStats } from '../../cfg/MovableEntityStats'
import { EntityStep } from './EntityStep'
import { MoveState } from './MoveState'
import { JOB_ACTION_RANGE } from '../../main'
import { TerrainPath } from './map/TerrainPath'

export abstract class MovableEntity extends AnimEntity {

    pathToTarget: Vector2[] = null

    constructor(entityType: AnimationEntityType) {
        super(entityType)
    }

    abstract get stats(): MovableEntityStats

    getPosition(): Vector3 {
        return new Vector3(this.group.position.x, this.group.position.y, this.group.position.z)
    }

    getPosition2D(): Vector2 {
        return new Vector2(this.group.position.x, this.group.position.z)
    }

    getSpeed(): number {
        return this.stats.RouteSpeed[this.level] * (this.animation?.transcoef || 1) * (this.isOnPath() ? this.stats.PathCoef : 1)
    }

    moveToTarget(target: Vector2): MoveState {
        return this.moveToClosestTarget([target])
    }

    moveToClosestTarget(targets: Vector2[]): MoveState {
        if (!this.pathToTarget || !targets.some((t) => t.equals(this.pathToTarget[this.pathToTarget.length - 1]))) {
            const paths = targets.map((t) => this.findPathToTarget(t))
                .sort((l, r) => l.lengthSq - r.lengthSq)
            this.pathToTarget = paths.length > 0 ? paths[0].locations : null
            if (!this.pathToTarget) return MoveState.TARGET_UNREACHABLE
        }
        const step = this.determineStep()
        if (step.targetReached) return MoveState.TARGET_REACHED
        this.changeActivity(this.getRouteActivity())
        this.group.position.add(step.vec)
        this.group.lookAt(new Vector3(this.pathToTarget[0].x, this.group.position.y, this.pathToTarget[0].y))
        return MoveState.MOVED
    }

    abstract getRouteActivity(): BaseActivity

    findPathToTarget(target: Vector2): TerrainPath {
        return new TerrainPath(target)
    }

    determineStep(): EntityStep {
        const step = this.getEntityStep(this.pathToTarget[0])
        const entitySpeed = this.getSpeed() // TODO use average speed between current and target position
        const stepLengthSq = step.vec.lengthSq()
        if (stepLengthSq > entitySpeed * entitySpeed && stepLengthSq > JOB_ACTION_RANGE * JOB_ACTION_RANGE) {
            step.vec.setLength(entitySpeed)
        } else if (this.pathToTarget.length > 1) {
            this.pathToTarget.shift()
            return this.determineStep()
        } else {
            step.targetReached = true
        }
        return step
    }

    getEntityStep(target: Vector2): EntityStep {
        return new EntityStep(target.x - this.group.position.x, this.determinePosY(target.x, target.y) - this.determinePosY(this.group.position.x, this.group.position.z), target.y - this.group.position.z)
    }

    determinePosY(x: number, z: number) {
        return this.worldMgr.getFloorHeight(x, z)
    }

    isOnRubble() {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).hasRubble()
    }

    isOnPath(): boolean {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).isPath()
    }

}
