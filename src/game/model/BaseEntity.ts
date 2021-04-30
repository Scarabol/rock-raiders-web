import { Group, Vector2 } from 'three'
import { WorldManager } from '../WorldManager'
import { EntitySuperType, EntityType } from './EntityType'
import { Surface } from './map/Surface'

export abstract class BaseEntity {

    worldMgr: WorldManager
    group: Group = new Group()

    superType: EntitySuperType = null
    entityType: EntityType = null
    level: number = 0

    protected constructor(superType: EntitySuperType, entityType: EntityType) {
        this.superType = superType
        this.entityType = entityType
    }

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

    removeFromScene() {
        this.worldMgr.sceneManager.scene.remove(this.group)
    }

    get surfaces(): Surface[] {
        return [this.worldMgr.sceneManager.terrain.getSurfaceFromWorld(this.group.position)]
    }

}
