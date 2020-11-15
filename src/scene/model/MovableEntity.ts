import { AnimEntity } from './anim/AnimEntity';
import { Vector3 } from 'three';
import { AnimationEntityType } from './anim/AnimationEntityType';
import { FulfillerActivity } from './FulfillerEntity';

export abstract class MovableEntity extends AnimEntity {

    speed: number;

    constructor(entityType: AnimationEntityType, speed: number) {
        super(entityType);
        this.speed = speed;
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.group.position);
    }

    getSpeed() {
        return this.speed;
    }

    moveToTarget(target: Vector3) {
        target.y = this.worldMgr.getTerrainHeight(target.x, target.z);
        if (this.isOnRubble()) {
            this.changeActivity(FulfillerActivity.MOVING_RUBBLE);
        } else {
            this.changeActivity(FulfillerActivity.MOVING);
        }
        const step = new Vector3().copy(target).sub(this.getPosition());
        if (step.length() > this.getSpeed()) step.setLength(this.getSpeed()); // TODO use average speed between current and target position
        this.group.position.add(step);
        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
        this.group.lookAt(new Vector3(target.x, this.group.position.y, target.z));
    }

    abstract isOnRubble(): boolean;

    changeActivity(activity: FulfillerActivity, onChangeDone = null) {
    }

}