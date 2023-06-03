import { LegacyAnimatedSceneEntity } from '../../../scene/LegacyAnimatedSceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { Surface } from '../../terrain/Surface'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'

export class Dynamite extends MaterialEntity {
    constructor(worldMgr: WorldManager, readonly targetSurface: Surface) {
        super(worldMgr, EntityType.DYNAMITE, PriorityIdentifier.DESTRUCTION, RaiderTraining.DEMOLITION, targetSurface)
        this.sceneEntity = new LegacyAnimatedSceneEntity(this.worldMgr.sceneMgr, ResourceManager.configuration.miscObjects.Dynamite)
        this.sceneEntity.changeActivity()
        this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity.group, {gameEntity: this.entity, entityType: this.entityType}, {PickSphere: 8})) // XXX find any constant for pick sphere?
    }
}
