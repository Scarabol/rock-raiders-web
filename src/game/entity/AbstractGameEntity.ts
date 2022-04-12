import { Generic } from '../../core/Util'
import { EntityType } from '../model/EntityType'
import { GameComponent } from '../model/GameComponent'
import { WorldManager } from '../WorldManager'

export class AbstractGameEntity {
    readonly components: GameComponent[] = []
    worldMgr: WorldManager = null

    constructor(readonly entityType: EntityType) {
    }

    addComponent<T extends GameComponent>(component: T): T {
        this.components.push(component)
        return component
    }

    getComponent<T extends GameComponent>(constr: Generic<T>): T {
        if (!this.worldMgr) throw new Error('This entity is not yet setup!')
        for (const c of this.components) {
            if (c instanceof constr) {
                return c as T
            }
        }
        throw new Error(`Could not find component ${constr} in entity ${this.constructor.name} but has ${this.components.map((c) => c.constructor.name).join(', ')} components`)
    }

    setupEntity(worldMgr: WorldManager) {
        if (this.worldMgr) throw new Error('This entity is already setup!')
        this.worldMgr = worldMgr
        this.components.forEach((c) => c.setupComponent(this))
    }

    disposeEntity() {
        this.components.forEach((c) => c.disposeComponent())
    }
}
