import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneEntity } from '../../../scene/SceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'

export class Ore extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.ORE, PriorityIdentifier.ORE, RaiderTraining.NONE, null)
        this.sceneEntity = new SceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.addToMeshGroup(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Ore))
        this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity.group, {gameEntity: this.entity, entityType: this.entityType}, ResourceManager.configuration.stats.ore))
    }
}
