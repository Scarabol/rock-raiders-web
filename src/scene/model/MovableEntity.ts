import { AnimEntity } from './anim/AnimEntity'
import { Vector3 } from 'three'
import { AnimationEntityType } from './anim/AnimationEntityType'
import { BaseActivity } from './activities/BaseActivity'
import { MovableEntityStats } from '../../cfg/MovableEntityStats'

export abstract class MovableEntity extends AnimEntity {

    pathToTarget: Vector3[] = null

    constructor(entityType: AnimationEntityType) {
        super(entityType)
    }

    abstract get stats(): MovableEntityStats

    getPosition(): Vector3 {
        return new Vector3().copy(this.group.position)
    }

    getSpeed(): number {
        return this.stats.RouteSpeed[this.level] * (this.animation?.transcoef || 1) * (this.isOnPath() ? this.stats.PathCoef : 1)
    }

    moveToTarget(target: Vector3): boolean {
        if (!this.pathToTarget || !this.pathToTarget[this.pathToTarget.length - 1].equals(target)) {
            this.pathToTarget = this.findPathToTarget(target)
            if (!this.pathToTarget) return false
        }
        this.changeActivity(this.getRouteActivity())
        this.group.position.add(this.determineStep())
        this.group.position.y = this.determinePosY()
        this.group.lookAt(new Vector3(this.pathToTarget[0].x, this.group.position.y, this.pathToTarget[0].z))
        return true
    }

    protected determinePosY() {
        return this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z)
    }

    abstract getRouteActivity(): BaseActivity

    findPathToTarget(target: Vector3): Vector3[] {
        return [target]
    }

    determineStep(): Vector3 {
        const pathStepTarget = this.pathToTarget[0]
        pathStepTarget.y = this.determinePosY()
        const step = new Vector3().copy(pathStepTarget).sub(this.getPosition())
        if (step.length() > this.getSpeed()) {
            step.setLength(this.getSpeed()) // TODO use average speed between current and target position
        } else if (this.pathToTarget.length > 1) {
            this.pathToTarget.shift()
            return this.determineStep()
        }
        return step
    }

    isOnRubble() {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).hasRubble()
    }

    isOnPath(): boolean {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position).isPath()
    }

}
