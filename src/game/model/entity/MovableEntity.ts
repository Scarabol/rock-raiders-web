import { AnimEntity } from '../../../scene/model/AnimEntity';
import { Vector3 } from 'three';
import { AnimationEntityType } from '../../../scene/model/AnimationEntityType';

export abstract class MovableEntity extends AnimEntity {

    speed: number;

    constructor(entityType: AnimationEntityType, speed: number) {
        super(entityType);
        this.speed = speed;
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.group.position);
    }

    getSpeed() { // TODO adapt speed to surrounding or carrying status?!
        return this.speed; // TODO derive max speed from entity type
    }

    move(target: Vector3) {
        this.group.lookAt(target);
        const step = new Vector3().copy(target).sub(this.group.position);
        const stepLength = step.length();
        if (stepLength > this.getSpeed() / 10) {
            if (stepLength > this.getSpeed()) {
                step.setLength(this.getSpeed());
            }
            this.group.position.add(step); // TODO instead send entity moved like world events
        } else {
            this.group.position.copy(target);
        }
        this.group.position.y = this.worldMgr.getTerrainHeight(this.group.position.x, this.group.position.z);
    }

}