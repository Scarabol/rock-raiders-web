import { AbstractGameComponent, GameEntity } from '../ECS'
import { SceneMesh } from '../../scene/SceneMesh'
import { Vector2 } from 'three'
import { EntityType } from '../model/EntityType'
import { BuildingType } from '../model/building/BuildingType'

export class BoulderComponent extends AbstractGameComponent {
    constructor(
        readonly entityType: EntityType.BOULDER | EntityType.BOULDER_ICE,
        readonly mesh: SceneMesh,
        readonly targetEntity: GameEntity,
        readonly targetBuildingType: BuildingType,
        readonly targetLevel: number,
        readonly targetLocation: Vector2,
    ) {
        super()
    }
}
