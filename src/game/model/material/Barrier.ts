import { LegacyAnimatedSceneEntity } from '../../../scene/LegacyAnimatedSceneEntity'
import { WorldManager } from '../../WorldManager'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RaiderTraining } from '../raider/RaiderTraining'
import { BarrierLocation } from './BarrierLocation'
import { MaterialEntity } from './MaterialEntity'
import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneSelectionComponent } from '../../component/SceneSelectionComponent'

export class Barrier extends MaterialEntity {
    constructor(worldMgr: WorldManager, readonly location: BarrierLocation, readonly site: BuildingSite) {
        super(worldMgr, EntityType.BARRIER, PriorityIdentifier.CONSTRUCTION, RaiderTraining.NONE, null)
        this.sceneEntity = new LegacyAnimatedSceneEntity(this.worldMgr.sceneMgr, ResourceManager.configuration.miscObjects.Barrier)
        this.sceneEntity.changeActivity()
        this.worldMgr.ecs.addComponent(this.entity, new SceneSelectionComponent(this.sceneEntity.group, {gameEntity: this.entity, entityType: this.entityType}, {PickSphere: 10})) // XXX find any constant for pick sphere?
    }
}
