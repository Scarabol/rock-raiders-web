import { Task } from './Task';
import { Vector3 } from 'three';
import { MovableEntity } from '../entity/MovableEntity';

export class MoveToTarget extends Task {

    entity: MovableEntity;
    target: Vector3; // TODO job system in 2d should be sufficient and decouple from three for deps and worker reasons

    constructor(entity: MovableEntity, target: Vector3) {
        super();
        this.entity = entity;
        this.target = target;
    }

    isIncomplete(): boolean {
        return new Vector3().copy(this.target).sub(this.entity.getPosition()).lengthSq() > this.entity.getSpeed(); // TODO externalize constant
    }

    doIt() {
        this.entity.move(this.target);
    }

    cancel() {
    }

}