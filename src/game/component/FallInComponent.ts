import { AbstractGameComponent } from '../ECS'
import { Surface } from '../terrain/Surface'

export class FallInComponent extends AbstractGameComponent {
    timer: number

    constructor(
        readonly target: Surface,
        readonly maxTimerMs: number,
    ) {
        super()
        this.timer = Math.random() * maxTimerMs
    }
}
