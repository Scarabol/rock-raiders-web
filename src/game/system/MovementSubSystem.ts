import { AbstractSubSystem } from './AbstractSubSystem'
import { MovementGameComponent } from '../component/common/MovementGameComponent'

export class MovementSubSystem extends AbstractSubSystem<MovementGameComponent> {
    constructor() {
        super(MovementGameComponent)
    }

    update(elapsedMs: number) {
        this.components.forEach((c) => c.update(elapsedMs))
    }
}
