import { Group, Vector2 } from 'three'
import { WorldManager } from '../WorldManager'
import { Surface } from './map/Surface'

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

    getCurrentSurface(): Surface {
        return this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position)
    }

    removeFromScene() {
        this.worldMgr.sceneManager.scene.remove(this.group)
    }

}
