import { ResourceManager } from '../../../resource/ResourceManager'
import { OreSceneEntity } from '../../../scene/entities/OreSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { SiteCarryPathTarget } from '../job/carry/SiteCarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Ore extends MaterialEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.ORE)
        this.sceneEntity = new OreSceneEntity(sceneMgr)
        this.sceneEntity.pickSphere.userData = {entityType: EntityType.ORE, materialEntity: this}
    }

    findCarryTargets(): CarryPathTarget[] {
        const sites = this.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => new SiteCarryPathTarget(s, s.getRandomDropPosition()))
        const oreRefineries = this.entityMgr.getBuildingCarryPathTargets(EntityType.ORE_REFINERY)
        if (oreRefineries.length > 0) return oreRefineries
        return this.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }

    get stats() {
        return ResourceManager.stats.Ore
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityOre
    }

}
