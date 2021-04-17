import { WorldManager } from '../WorldManager'
import { Group, Vector2 } from 'three'

export abstract class BaseEntity {

    worldMgr: WorldManager
    group: Group = new Group()
    level: number = 0

    abstract get stats()

    getPosition() {
        return this.group.position.clone()
    }

    getPosition2D() {
        return new Vector2(this.group.position.x, this.group.position.z)
    }

    getHeading(): number {
        return this.group.rotation.y
    }

    onDiscover() {
        this.group.visible = true
    }

}
