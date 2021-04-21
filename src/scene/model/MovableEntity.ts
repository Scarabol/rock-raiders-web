import { AnimEntity } from './anim/AnimEntity'
import { Vector2, Vector3 } from 'three'
import { AnimationEntityType } from './anim/AnimationEntityType'
import { MovableEntityStats } from '../../cfg/MovableEntityStats'
import { EntityStep } from './EntityStep'
import { MoveState } from './MoveState'
import { JOB_ACTION_RANGE } from '../../main'
import { TerrainPath } from './map/TerrainPath'
import { PathTarget } from './PathTarget'
import { AnimEntityActivity } from './activities/AnimEntityActivity'

export abstract class MovableEntity extends AnimEntity {

    currentPath: TerrainPath = null

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

    moveToClosestTarget(target: PathTarget[]): MoveState {
        if (!this.currentPath || !target.some((t) => t.targetLocation.equals(this.currentPath.targetPosition))) {
            const paths = target.map((t) => this.findPathToTarget(t))
                .sort((l, r) => l.lengthSq - r.lengthSq)
            this.currentPath = paths.length > 0 ? paths[0] : null
            if (!this.currentPath) return MoveState.TARGET_UNREACHABLE
        }
        const step = this.determineStep()
        if (step.targetReached) return MoveState.TARGET_REACHED
        this.changeActivity(this.getRouteActivity())
        this.group.position.add(step.vec)
        const nextLocation = this.currentPath.firstLocation
        this.group.lookAt(new Vector3(nextLocation.x, this.group.position.y, nextLocation.y))
        return MoveState.MOVED
    }

    abstract getRouteActivity(): AnimEntityActivity

    findPathToTarget(target: PathTarget): TerrainPath {
        return new TerrainPath(target, target.targetLocation)
    }

    determineStep(): EntityStep {
        const step = this.getEntityStep(this.currentPath.firstLocation)
        const entitySpeed = this.getSpeed() // TODO use average speed between current and target position
        const stepLengthSq = step.vec.lengthSq()
        if (stepLengthSq > entitySpeed * entitySpeed && stepLengthSq > JOB_ACTION_RANGE * JOB_ACTION_RANGE) {
            step.vec.setLength(entitySpeed)
        } else if (this.currentPath.locations.length > 1) {
            this.currentPath.locations.shift()
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
