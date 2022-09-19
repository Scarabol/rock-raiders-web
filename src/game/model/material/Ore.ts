import { OreSceneEntity } from '../../../scene/entities/OreSceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'

export class Ore extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.ORE, PriorityIdentifier.ORE, RaiderTraining.NONE)
        this.sceneEntity = new OreSceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.pickSphere.userData = {entityType: EntityType.ORE, materialEntity: this}
    }

    findCarryTargets(): PathTarget[] {
        const sites = this.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => PathTarget.fromSite(s.getRandomDropPosition(), s))
        const oreRefineries = this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.ORE_REFINERY)
        if (oreRefineries.length > 0) return oreRefineries
        return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }
}
