import { AnimEntity } from './anim/AnimEntity'
import { Vector3 } from 'three'
import { AnimationEntityType } from './anim/AnimationEntityType'
import { FulfillerActivity } from './FulfillerEntity'

export abstract class MovableEntity extends AnimEntity {

    pathToTarget: Vector3[] = null

    constructor(entityType: AnimationEntityType) {
        super(entityType)
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.group.position)
    }

    abstract getSpeed(): number

    moveToTarget(target: Vector3): boolean {
        if (!this.pathToTarget || !this.pathToTarget[this.pathToTarget.length - 1].equals(target)) {
            this.pathToTarget = this.findPathToTarget(target)
            if (!this.pathToTarget) return false
        }
        if (this.isOnRubble()) {
            this.changeActivity(FulfillerActivity.MOVING_RUBBLE)
        } else {
            this.changeActivity(FulfillerActivity.MOVING)
        }
        this.group.position.add(this.determineStep())
        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z)
        this.group.lookAt(new Vector3(this.pathToTarget[0].x, this.group.position.y, this.pathToTarget[0].z))
        return true
    }

    findPathToTarget(target: Vector3): Vector3[] {
        return [target]
    }

    determineStep(): Vector3 {
        const pathStepTarget = this.pathToTarget[0]
        pathStepTarget.y = this.worldMgr.getTerrainHeight(pathStepTarget.x, pathStepTarget.z)
        const step = new Vector3().copy(pathStepTarget).sub(this.getPosition())
        if (step.length() > this.getSpeed()) {
            step.setLength(this.getSpeed()) // TODO use average speed between current and target position
        } else if (this.pathToTarget.length > 1) {
            this.pathToTarget.shift()
            return this.determineStep()
        }
        return step
    }

    isOnRubble(): boolean {
        return false
    }

    changeActivity(activity: FulfillerActivity, onChangeDone = null, iterations = 1) {
    }

}
