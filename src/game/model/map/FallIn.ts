import { getRandom } from '../../../core/Util'
import { Surface } from './Surface'

export class FallIn {

    source: Surface
    target: Surface
    fallinTimeout: number
    timer: number = 0

    constructor(source: Surface, target: Surface) {
        this.source = source
        this.target = target
        this.resetTimeout()
    }

    update(elapsedMs: number) {
        this.timer += elapsedMs
        if (this.timer < this.fallinTimeout) return
        this.source.createFallin(this.target)
        this.timer -= this.fallinTimeout
        this.resetTimeout()
    }

    private resetTimeout() {
        this.fallinTimeout = (30 + getRandom(60)) * 1000 // TODO adapt timer to level multiplier and fallin value
    }

}
