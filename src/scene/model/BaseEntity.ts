import { WorldManager } from '../WorldManager';
import { Euler, Group, Vector3 } from 'three';

export class BaseEntity {

    worldMgr: WorldManager;
    group: Group = new Group();
    sequenceIntervals = [];

    constructor() {
        // this.group.add(new AxesHelper(40)); // TODO debug orientations and possible x-axis flip
    }

    getPosition() {
        return new Vector3().copy(this.group.position);
    }

    getRotation() {
        return new Euler().copy(this.group.rotation);
    }

    getGroup() {
        return this.group;
    }

    onDiscover() {
        this.group.visible = true;
    }

}
