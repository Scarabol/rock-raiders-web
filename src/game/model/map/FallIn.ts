import { getRandom } from '../../../core/Util'
import { Surface } from './Surface'
import { Terrain } from './Terrain'

export class FallIn {

    terrain: Terrain
    source: Surface
    target: Surface
    fallinTimeout: number
    timer: number = 0

    constructor(terrain: Terrain, source: Surface, target: Surface) {
        this.terrain = terrain
        this.source = source
        this.target = target
        this.restartTimeout()
    }

    update(elapsedMs: number) {
        this.timer += elapsedMs
        if (this.timer < this.fallinTimeout) return
        if (this.source.discovered) this.terrain.createFallIn(this.source, this.target)
        this.timer -= this.fallinTimeout
        this.restartTimeout()
    }

    private restartTimeout() {
        this.fallinTimeout = (30 + getRandom(60)) * 1000 // TODO adapt timer to level multiplier and fallin value
    }

}
