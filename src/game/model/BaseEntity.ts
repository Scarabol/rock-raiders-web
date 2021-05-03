import { Group, Vector2, Vector3 } from 'three'
import { SceneManager } from '../SceneManager'
import { WorldManager } from '../WorldManager'
import { EntitySuperType, EntityType } from './EntityType'
import { Surface } from './map/Surface'

export abstract class BaseEntity {

    worldMgr: WorldManager
    sceneMgr: SceneManager

    group: Group = new Group()

    superType: EntitySuperType = null
    entityType: EntityType = null
    level: number = 0
    floorOffset: number = 0

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, superType: EntitySuperType, entityType: EntityType) {
        this.worldMgr = worldMgr
        this.sceneMgr = sceneMgr
        this.superType = superType
        this.entityType = entityType
    }

    get stats() {
        return null
    }

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

    addToScene(worldPosition: Vector2, radHeading: number) {
        if (worldPosition) {
            this.group.position.copy(this.sceneMgr.getFloorPosition(worldPosition))
            this.group.position.y += this.floorOffset
        }
        if (radHeading !== undefined && radHeading !== null) {
            this.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading)
        }
        this.group.visible = this.surfaces.every((s) => s.discovered)
        this.sceneMgr.scene.add(this.group)
    }

    removeFromScene() {
        this.sceneMgr.scene.remove(this.group)
    }

    get surfaces(): Surface[] {
        return [this.sceneMgr.terrain.getSurfaceFromWorld(this.group.position)]
    }

}
