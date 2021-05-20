import { Vector2 } from 'three'
import { SceneEntity } from '../../scene/SceneEntity'
import { SceneManager } from '../SceneManager'
import { WorldManager } from '../WorldManager'
import { EntityType } from './EntityType'
import { Surface } from './map/Surface'

export abstract class BaseEntity {

    worldMgr: WorldManager
    sceneMgr: SceneManager

    sceneEntity: SceneEntity = new SceneEntity()

    entityType: EntityType = null
    floorOffset: number = 0.1

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType) {
        this.worldMgr = worldMgr
        this.sceneMgr = sceneMgr
        this.entityType = entityType
    }

    getPosition() {
        return this.sceneEntity.position.clone()
    }

    getPosition2D() {
        return new Vector2(this.sceneEntity.position.x, this.sceneEntity.position.z)
    }

    getHeading(): number {
        return this.sceneEntity.getHeading()
    }

    onDiscover() {
        this.sceneEntity.visible = true
    }

    addToScene(worldPosition: Vector2, radHeading: number) {
        if (worldPosition) {
            this.sceneEntity.position.copy(this.sceneMgr.getFloorPosition(worldPosition))
            this.sceneEntity.position.y += this.floorOffset
        }
        if (radHeading !== undefined && radHeading !== null) {
            this.sceneEntity.setHeading(radHeading)
        }
        this.sceneEntity.visible = this.surfaces.some((s) => s.discovered)
        this.sceneMgr.scene.add(this.sceneEntity.group)
    }

    removeFromScene() {
        this.sceneMgr.scene.remove(this.sceneEntity.group)
    }

    get surfaces(): Surface[] {
        return [this.sceneMgr.terrain.getSurfaceFromWorld(this.sceneEntity.position)]
    }

}
