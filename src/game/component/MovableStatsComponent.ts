import { AbstractGameComponent } from '../ECS'
import { MovableEntityStats } from '../../cfg/GameStatsCfg'

export class MovableStatsComponent extends AbstractGameComponent {
    level: number = 0

    constructor(readonly stats: MovableEntityStats) {
        super()
    }

    getSpeed(isOnPath: boolean, isOnRubble: boolean): number {
        const routeSpeed = this.stats.routeSpeed[this.level]
        const pathCoef = isOnPath ? this.stats.pathCoef : 1
        const rubbleCoef = isOnRubble ? this.stats.rubbleCoef : 1
        return routeSpeed * pathCoef * rubbleCoef
    }
}
