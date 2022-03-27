import { GameComponent } from '../model/GameComponent'
import { Generic } from '../../core/Util'
import { EntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { Vector2, Vector3 } from 'three'
import { AnimatedSceneEntityComponent } from '../component/common/AnimatedSceneEntityComponent'

export class AbstractGameEntity {
    readonly components: GameComponent[] = []
    worldMgr: WorldManager = null

    constructor(readonly entityType: EntityType) {
    }

    addComponent<T extends GameComponent>(component: T): T {
        this.components.push(component)
        return component
    }

    getComponent<T extends GameComponent>(constr: Generic<T>): T | null {
        for (const c of this.components) {
            if (c instanceof constr) {
                return c as T
            }
        }
        throw new Error(`Could not find component ${constr} in entity ${this} but has ${this.components} components`)
    }

    setupEntity(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        this.components.forEach((c) => c.setupComponent(this))
    }

    disposeEntity() {
        this.components.forEach((c) => c.disposeComponent())
    }

    markDead() {
        this.worldMgr.markDead(this)
    }

    get position(): Vector3 {
        return this.getComponent(AnimatedSceneEntityComponent).sceneEntity.position
    }

    get position2D(): Vector2 {
        return this.getComponent(AnimatedSceneEntityComponent).sceneEntity.position2D
    }
}
