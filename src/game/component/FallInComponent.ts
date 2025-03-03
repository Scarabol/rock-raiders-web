import { AbstractGameComponent } from '../ECS'
import { Surface } from '../terrain/Surface'
import { PRNG } from '../factory/PRNG'

export class FallInComponent extends AbstractGameComponent {
    timer: number

    constructor(
        readonly target: Surface,
        readonly maxTimerMs: number,
    ) {
        super()
        this.timer = PRNG.terrain.randInt(maxTimerMs)
    }
}
