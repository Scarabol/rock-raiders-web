import { GameComponent } from '../../model/GameComponent'
import { Updatable } from '../../model/Updateable'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'

export class MovementGameComponent implements GameComponent, Updatable {
    setupComponent(entity: AbstractGameEntity) {
    }

    update(elapsedMs: number) {
    }

    disposeComponent() {
    }
}
