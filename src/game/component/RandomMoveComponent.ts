import { AbstractGameComponent } from '../ECS'
import { PRNG } from '../factory/PRNG'

export class RandomMoveComponent extends AbstractGameComponent {
    idleTimer: number = 0

    constructor(readonly maxIdleTimer: number) {
        super()
        this.resetIdleTimer()
    }

    isOnIdleTimer(elapsedMs: number): boolean {
        if (this.idleTimer > 0) {
            this.idleTimer -= elapsedMs
            return true
        }
        return this.resetIdleTimer()
    }

    private resetIdleTimer() {
        if (this.maxIdleTimer <= 0) return false
        this.idleTimer = PRNG.movement.randInt(this.maxIdleTimer)
        return false
    }
}
