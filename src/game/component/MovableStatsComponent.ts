import { AbstractGameComponent } from '../ECS'
import { MonsterEntityStats } from '../../cfg/GameStatsCfg'

export class MovableStatsComponent extends AbstractGameComponent {
    routeSpeed: number[] = [1]
    pathCoef: number = 1
    rubbleCoef: number = 1
    level: number = 0
    enterWall: boolean = false
    crossLand: boolean = false
    crossWater: boolean = false
    crossLava: boolean = false

    constructor(stats: MonsterEntityStats) {
        super()
        this.routeSpeed = stats.RouteSpeed
        this.pathCoef = stats.PathCoef
        this.rubbleCoef = stats.RubbleCoef
        this.enterWall = stats.RandomEnterWall
        this.crossLand = stats.CrossLand
        this.crossWater = stats.CrossWater
        this.crossLava = stats.CrossLava
    }

    getSpeed(isOnPath: boolean, isOnRubble: boolean): number {
        const routeSpeed = this.routeSpeed[this.level]
        const pathCoef = isOnPath ? this.pathCoef : 1
        const rubbleCoef = isOnRubble ? this.rubbleCoef : 1
        return routeSpeed * pathCoef * rubbleCoef
    }
}
