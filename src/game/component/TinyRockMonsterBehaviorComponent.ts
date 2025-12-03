import { AbstractGameComponent } from '../ECS'
import { Surface } from '../terrain/Surface'
import { TerrainPath } from '../terrain/TerrainPath'

export enum TinyRockMonsterBehaviorState{
  PANIC = 1,
  GOTO_WALL,
  ENTER_WALL,
}

export class TinyRockMonsterBehaviorComponent extends AbstractGameComponent {
    state: TinyRockMonsterBehaviorState = TinyRockMonsterBehaviorState.PANIC
    currentPath: TerrainPath | undefined
    wall: Surface | undefined
}
