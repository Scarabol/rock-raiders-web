import { ResourceManager } from '../../../resource/ResourceManager'
import { OreSceneEntity } from '../../../scene/entities/OreSceneEntity'
import { EntityType } from '../EntityType'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { SiteCarryPathTarget } from '../job/carry/SiteCarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'
import { WorldManager } from '../../WorldManager'

export class Ore extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.ORE)
        this.sceneEntity = new OreSceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.pickSphere.userData = {entityType: EntityType.ORE, materialEntity: this}
    }

    findCarryTargets(): CarryPathTarget[] {
        const sites = this.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => new SiteCarryPathTarget(s, s.getRandomDropPosition()))
        const oreRefineries = this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.ORE_REFINERY)
        if (oreRefineries.length > 0) return oreRefineries
        return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }

    get stats() {
        return ResourceManager.configuration.stats.Ore
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.ORE
    }
}
