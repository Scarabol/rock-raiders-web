import { AbstractGameComponent } from '../ECS'
import { MovableEntityStats } from '../../cfg/GameStatsCfg'

export class MovableStatsComponent extends AbstractGameComponent {
    routeSpeed: number[] = [1]
    pathCoef: number = 1
    rubbleCoef: number = 1
    level: number = 0

    constructor(stats: MovableEntityStats) {
        super()
        this.routeSpeed = stats.RouteSpeed
        this.pathCoef = stats.PathCoef
        this.rubbleCoef = stats.RubbleCoef
    }

    getSpeed(isOnPath: boolean, isOnRubble: boolean): number {
        const routeSpeed = this.routeSpeed[this.level]
        const pathCoef = isOnPath ? this.pathCoef : 1
        const rubbleCoef = isOnRubble ? this.rubbleCoef : 1
        return routeSpeed * pathCoef * rubbleCoef
    }
}
