import { AbstractGameComponent } from '../ECS'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { PathTarget } from '../model/PathTarget'

export enum SlugBehaviorState {
    IDLE,
    LEECH,
    GO_ENTER,
}

export class SlugBehaviorComponent extends AbstractGameComponent {
    state: SlugBehaviorState = SlugBehaviorState.IDLE
    energyLeeched: boolean = false
    targetBuilding: BuildingEntity = null
    targetEnter: PathTarget = null
    idleTimer: number = 0
}
