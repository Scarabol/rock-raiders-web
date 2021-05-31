import { ResourceManager } from '../../../resource/ResourceManager'
import { OreSceneEntity } from '../../../scene/entities/OreSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { BuildingCarryPathTarget, CarryPathTarget, SiteCarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Ore extends MaterialEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.ORE)
        this.sceneEntity = new OreSceneEntity(sceneMgr)
    }

    findCarryTargets(): CarryPathTarget[] {
        const sites = this.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => new SiteCarryPathTarget(s, s.getRandomDropPosition()))
        const oreRefineries = this.entityMgr.getBuildingsByType(EntityType.ORE_REFINERY)
        if (oreRefineries.length > 0) return oreRefineries.map((b) => new BuildingCarryPathTarget(b))
        const toolStations = this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION)
        return toolStations.map((b) => new BuildingCarryPathTarget(b))
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityOre
    }

}
