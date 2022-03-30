import { MovableEntityStats } from '../../../cfg/GameStatsCfg'
import { AbstractGameEntity } from '../../entity/AbstractGameEntity'
import { GameComponent } from '../../model/GameComponent'
import { AnimatedSceneEntityComponent } from './AnimatedSceneEntityComponent'

export class MovableEntityStatsComponent implements GameComponent {
    level: number = 0
    entity: AbstractGameEntity
    sceneEntity: AnimatedSceneEntityComponent

    constructor(readonly stats: MovableEntityStats) {
    }

    setupComponent(entity: AbstractGameEntity) {
        this.entity = entity
        this.sceneEntity = entity.getComponent(AnimatedSceneEntityComponent)
    }

    disposeComponent() {
    }

    getSpeed(): number {
        const currentSurface = this.sceneEntity.surface
        const routeSpeed = this.stats.RouteSpeed[this.level]
        const pathCoef = currentSurface.isPath() ? this.stats.PathCoef : 1
        const rubbleCoef = currentSurface.hasRubble() ? this.stats.RubbleCoef : 1
        return routeSpeed * pathCoef * rubbleCoef
    }
}
