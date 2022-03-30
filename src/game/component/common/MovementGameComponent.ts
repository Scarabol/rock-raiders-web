import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'
import { Updatable } from '../../model/Updateable'

export class MovementGameComponent implements GameComponent, Updatable {
    setupComponent(entity: AbstractGameEntity) {
    }

    update(elapsedMs: number) {
    }

    disposeComponent() {
    }
}
