import { AbstractGameComponent, GameEntity } from '../ECS'
import { RaiderTraining } from '../model/raider/RaiderTraining'
import { RaiderActivity } from '../model/anim/AnimationActivity'

export class DriverComponent extends AbstractGameComponent {
    driver: GameEntity

    constructor(
        readonly requiredTraining: RaiderTraining,
        readonly driverActivity: RaiderActivity,
        readonly invisibleDriver: boolean,
    ) {
        super()
    }
}
