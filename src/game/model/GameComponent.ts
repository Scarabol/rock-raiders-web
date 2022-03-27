import { AbstractGameEntity } from '../entity/AbstractGameEntity'

export interface GameComponent {
    setupComponent(entity: AbstractGameEntity)

    disposeComponent()
}
