import { AbstractGameComponent } from '../ECS'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'

export interface FlockEntity {
    sceneEntity: AnimatedSceneEntity
    separationDist?: number
    separationMult?: number
    cohesionDist?: number
    cohesionMult?: number
    alignmentMult?: number
    inertiaMult?: number
    speed?: number
}

export class FlockComponent extends AbstractGameComponent {
    readonly entities: Required<FlockEntity>[]

    constructor(entities: FlockEntity[], defaults?: Omit<FlockEntity, 'sceneEntity'>) {
        super()
        this.entities = entities.map((e) => ({
            sceneEntity: e.sceneEntity,
            separationDist: e.separationDist ?? defaults?.separationDist ?? 0,
            separationMult: e.separationMult ?? defaults?.separationMult ?? 1,
            cohesionDist: e.cohesionDist ?? defaults?.cohesionDist ?? 0,
            cohesionMult: e.cohesionMult ?? defaults?.cohesionMult ?? 1,
            alignmentMult: e.alignmentMult ?? defaults?.alignmentMult ?? 0,
            inertiaMult: e.inertiaMult ?? defaults?.inertiaMult ?? 0,
            speed: e.speed ?? defaults?.speed ?? 1,
        }))
    }
}
