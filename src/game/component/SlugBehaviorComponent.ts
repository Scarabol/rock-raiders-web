import { AbstractGameComponent } from '../ECS'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { PathTarget } from '../model/PathTarget'

export enum SlugBehaviorState {
    EMERGE,
    IDLE,
    LEECH,
    GO_ENTER,
}

export class SlugBehaviorComponent extends AbstractGameComponent {
    state: SlugBehaviorState = SlugBehaviorState.EMERGE
    energyLeeched: boolean = false
    targetBuilding: BuildingEntity
    targetEnter: PathTarget
    idleTimer: number = 0
}
