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
}

export class RockMonsterBehaviorComponent extends AbstractGameComponent {
    state: RockMonsterBehaviorState = RockMonsterBehaviorState.IDLE
    numCrystalsEaten: number = 0
    targetCrystal: MaterialEntity = null
    targetWall: Surface = null
    boulder: SceneMesh = null
    targetBuilding: BuildingEntity = null

    changeToIdle() {
        this.state = RockMonsterBehaviorState.IDLE
        this.targetCrystal = null
        this.targetWall = null
        this.targetBuilding = null
    }
}
