import { WorldManager } from '../WorldManager'
import { Euler, Group, Vector3 } from 'three'

export abstract class BaseEntity {

    worldMgr: WorldManager
    group: Group = new Group()
    sequenceIntervals = []
    level: number = 0

    abstract get stats()

    getPosition() {
        return new Vector3().copy(this.group.position)
    }

    getRotation() {
        return new Euler().copy(this.group.rotation)
    }

    onDiscover() {
        this.group.visible = true
    }

}
