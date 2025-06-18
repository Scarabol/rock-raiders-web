import { AbstractGameComponent } from '../ECS'
import { MovableEntityStats } from '../../cfg/GameStatsCfg'

export class MovableStatsComponent extends AbstractGameComponent {
    routeSpeed: number[] = [1]
    pathCoef: number = 1
    rubbleCoef: number = 1
    level: number = 0
    enterWall: boolean = false
    crossLand: boolean = false
    crossWater: boolean = false
    crossLava: boolean = false

    constructor(stats: MovableEntityStats) {
        super()
        this.routeSpeed = stats.routeSpeed
        this.pathCoef = stats.pathCoef
        this.rubbleCoef = stats.rubbleCoef
        this.enterWall = stats.randomEnterWall
        this.crossLand = stats.crossLand
        this.crossWater = stats.crossWater
        this.crossLava = stats.crossLava
    }

    getSpeed(isOnPath: boolean, isOnRubble: boolean): number {
        const routeSpeed = this.routeSpeed[this.level]
        const pathCoef = isOnPath ? this.pathCoef : 1
        const rubbleCoef = isOnRubble ? this.rubbleCoef : 1
        return routeSpeed * pathCoef * rubbleCoef
    }
}
