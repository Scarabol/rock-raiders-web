import { AbstractGameComponent } from '../ECS'
import { MonsterEntityStats } from '../../cfg/GameStatsCfg'

export class RandomMoveComponent extends AbstractGameComponent {
    enterWall: boolean = false
    crossLand: boolean = false
    crossWater: boolean = false
    crossLava: boolean = false
    idleTimer: number = 0

    constructor(stats: MonsterEntityStats, readonly maxIdleTimer: number) {
        super()
        this.enterWall = stats.RandomEnterWall
        this.crossLand = stats.CrossLand
        this.crossWater = stats.CrossWater
        this.crossLava = stats.CrossLava
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
        this.idleTimer = Math.randomInclusive(this.maxIdleTimer)
        return false
    }
}
