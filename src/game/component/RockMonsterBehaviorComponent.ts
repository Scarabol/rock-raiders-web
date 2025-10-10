import { AbstractGameComponent } from '../ECS'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { Surface } from '../terrain/Surface'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { SceneMesh } from '../../scene/SceneMesh'

export const ROCK_MONSTER_BEHAVIOR_STATE = {
    idle: 0,
    gotoCrystal: 1,
    eatCrystal: 2,
    boulderAttack: 3,
    meleeAttack: 4,
    goHome: 5,
    gotoWall: 6,
    gather: 7,
    throw: 8,
    punch: 9,
    throwMan: 10,
    resting: 11,
    hitByLaser: 12,
} as const
type RockMonsterBehaviorState = typeof ROCK_MONSTER_BEHAVIOR_STATE[keyof typeof ROCK_MONSTER_BEHAVIOR_STATE]

export class RockMonsterBehaviorComponent extends AbstractGameComponent {
    state: RockMonsterBehaviorState = ROCK_MONSTER_BEHAVIOR_STATE.idle
    numCrystalsEaten: number = 0
    targetCrystal?: MaterialEntity
    targetWall?: Surface
    boulder?: SceneMesh
    targetBuilding?: BuildingEntity

    changeToIdle() {
        this.state = ROCK_MONSTER_BEHAVIOR_STATE.idle
        this.targetCrystal = undefined
        this.targetWall = undefined
        this.targetBuilding = undefined
    }
}
