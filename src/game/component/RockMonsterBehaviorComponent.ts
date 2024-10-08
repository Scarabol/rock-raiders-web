import { AbstractGameComponent } from '../ECS'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { Surface } from '../terrain/Surface'
import { BuildingEntity } from '../model/building/BuildingEntity'
import { SceneMesh } from '../../scene/SceneMesh'

export enum RockMonsterBehaviorState {
    IDLE,
    GOTO_CRYSTAL,
    EAT_CRYSTAL,
    BOULDER_ATTACK,
    MELEE_ATTACK,
    GO_HOME,
    GOTO_WALL,
    GATHER,
    THROW,
    PUNCH,
    THROW_MAN,
    RESTING,
    HIT_BY_LASER,
}

export class RockMonsterBehaviorComponent extends AbstractGameComponent {
    state: RockMonsterBehaviorState = RockMonsterBehaviorState.IDLE
    numCrystalsEaten: number = 0
    targetCrystal?: MaterialEntity
    targetWall?: Surface
    boulder?: SceneMesh
    targetBuilding?: BuildingEntity

    changeToIdle() {
        this.state = RockMonsterBehaviorState.IDLE
        this.targetCrystal = undefined
        this.targetWall = undefined
        this.targetBuilding = undefined
    }
}
