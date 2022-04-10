import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'

export class LifecycleComponent implements GameComponent {
    dead: boolean = false
    entity: AbstractGameEntity

    setupComponent(entity: AbstractGameEntity) {
        this.entity = entity
    }

    disposeComponent() {
    }

    markDead() {
        this.dead = true
        this.entity.worldMgr.markDead(this.entity)
    }

    isDead() {
        return this.dead
    }
}
