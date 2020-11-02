import { AnimEntity } from '../../../scene/model/AnimEntity';
import { Task } from '../job/Task';
import { Vector3 } from 'three';
import { AnimationEntityType } from '../../../scene/model/AnimationEntityType';

export abstract class MovableEntity extends AnimEntity {

    workInterval;
    speed: number; // world coords per frame at 30 frames (tileSize is 40 by default)
    tasks: Task[] = [];

    constructor(entityType: AnimationEntityType, speed: number) {
        super(entityType);
        this.workInterval = setInterval(this.work.bind(this), 1000 / 30 / 2); // TODO externalize frame rate
        this.speed = speed;
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.group.position);
    }

    getSpeed() { // TODO adapt speed to surrounding or carrying status?!
        return this.speed / 2; // work is done twice per frame rate
    }

    move(target: Vector3) {
        const step = new Vector3().copy(target).sub(this.getPosition());
        const dist = step.length();
        if (dist > 1) { // TODO externalize constant
            if (dist > this.getSpeed()) {
                step.setLength(this.getSpeed());
            }
            step.y = 0; // TODO determine height from terrain
            this.group.position.add(step); // TODO instead send entity moved like world events
        } else {
            this.group.position.copy(target);
        }
    }

    work() { // TODO implement with intervals and timeouts
        for (let c = 0; c < this.tasks.length; c++) {
            const task = this.tasks[c];
            if (task.isIncomplete()) {
                task.doIt();
                break;
            } else {
                console.log('task complete');
            }
        }
        this.tasks = this.tasks.filter((t) => t.isIncomplete());
    }

}