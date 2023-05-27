import { Surface } from './Surface'
import { Terrain } from './Terrain'

export class FallIn {
    terrain: Terrain
    source: Surface
    target: Surface
    maxTimerMs: number
    fallInTimeout: number = 0
    timer: number = 0

    constructor(terrain: Terrain, source: Surface, target: Surface, maxTimerSeconds: number) {
        this.terrain = terrain
        this.source = source
        this.target = target
        this.maxTimerMs = maxTimerSeconds * 1000
        this.restartTimeout()
    }

    update(elapsedMs: number) {
        this.timer += elapsedMs
        if (this.timer < this.fallInTimeout) return
        if (this.source.discovered) this.terrain.createFallIn(this.source, this.target)
        this.timer -= this.fallInTimeout
        this.restartTimeout()
    }

    private restartTimeout() {
        this.fallInTimeout = Math.randomInclusive(this.maxTimerMs)
    }
}
