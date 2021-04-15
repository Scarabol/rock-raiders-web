import { AnimEntity } from './anim/AnimEntity'
import { Vector3 } from 'three'
import { AnimationEntityType } from './anim/AnimationEntityType'
import { BaseActivity } from './activities/BaseActivity'

export abstract class MovableEntity extends AnimEntity {

    pathToTarget: Vector3[] = null
    heightOffset: number = 0

    constructor(entityType: AnimationEntityType) {
        super(entityType)
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.group.position)
    }

    getSpeed(): number {
        let speed = this.stats.routeSpeed[this.level]
        if (this.isOnRubble()) {
            speed *= this.stats.rubbleCoef
        } else if (this.isOnPath()) {
            speed *= this.stats.pathCoef
        }
        return speed
    }

    moveToTarget(target: Vector3): boolean {
        if (!this.pathToTarget || !this.pathToTarget[this.pathToTarget.length - 1].equals(target)) {
            this.pathToTarget = this.findPathToTarget(target)
            if (!this.pathToTarget) return false
        }
        this.changeActivity(this.getRouteActivity())
        this.group.position.add(this.determineStep())
        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z) + this.heightOffset
        this.group.lookAt(new Vector3(this.pathToTarget[0].x, this.group.position.y, this.pathToTarget[0].z))
        return true
    }

    abstract getRouteActivity(): BaseActivity

    findPathToTarget(target: Vector3): Vector3[] {
        return [target]
    }

    determineStep(): Vector3 {
        const pathStepTarget = this.pathToTarget[0]
        pathStepTarget.y = this.worldMgr.getTerrainHeight(pathStepTarget.x, pathStepTarget.z) + this.heightOffset
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
