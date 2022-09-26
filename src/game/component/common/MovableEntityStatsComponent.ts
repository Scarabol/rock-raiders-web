import { MovableEntityStats } from '../../../cfg/GameStatsCfg'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'
import { PositionComponent } from './PositionComponent'

export class MovableEntityStatsComponent implements GameComponent {
    level: number = 0
    entity: AbstractGameEntity
    position: PositionComponent

    constructor(readonly stats: MovableEntityStats) {
    }

    setupComponent(entity: AbstractGameEntity) {
        this.entity = entity
        this.position = entity.getComponent(PositionComponent)
    }

    disposeComponent() {
    }

    getSpeed(): number {
        const routeSpeed = this.stats.RouteSpeed[this.level]
        const pathCoef = this.position.isOnPath() ? this.stats.PathCoef : 1
        const rubbleCoef = this.position.isOnRubble() ? this.stats.RubbleCoef : 1
        return routeSpeed * pathCoef * rubbleCoef
    }
}
