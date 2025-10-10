import { AbstractGameComponent } from '../ECS'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { PathTarget } from '../model/PathTarget'

export const SLUG_BEHAVIOR_STATE = {
    emerge: 1,
    idle: 2,
    leech: 3,
    goEnter: 4,
} as const
type SlugBehaviorState = typeof SLUG_BEHAVIOR_STATE[keyof typeof SLUG_BEHAVIOR_STATE]

export class SlugBehaviorComponent extends AbstractGameComponent {
    state: SlugBehaviorState = SLUG_BEHAVIOR_STATE.emerge
    energyLeeched: boolean = false
    targetBuilding?: BuildingEntity
    targetEnter?: PathTarget
    idleTimer: number = 0
}
