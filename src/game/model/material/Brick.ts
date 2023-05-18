import { ResourceManager } from '../../../resource/ResourceManager'
import { SceneEntity } from '../../../scene/SceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'
import { GameState } from "../GameState"
import { EventBus } from "../../../event/EventBus"
import { MaterialAmountChanged } from "../../../event/WorldEvents"

export class Brick extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.BRICK, PriorityIdentifier.ORE, RaiderTraining.NONE)
        this.sceneEntity = new SceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.addToMeshGroup(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.ProcessedOre))
        this.sceneEntity.addPickSphere(ResourceManager.configuration.stats.processedOre.PickSphere)
        this.sceneEntity.pickSphere.userData = {entityType: this.entityType, materialEntity: this}
    }

    findCarryTargets(): PathTarget[] {
        const sites = this.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => PathTarget.fromSite(s, s.getRandomDropPosition()))
        return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }

    onDeposit() {
        super.onDeposit()
        GameState.numBrick++
        EventBus.publishEvent(new MaterialAmountChanged())
    }
}
