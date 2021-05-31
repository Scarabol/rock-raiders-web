import { ResourceManager } from '../../../resource/ResourceManager'
import { CrystalSceneEntity } from '../../../scene/entities/CrystalSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { BuildingCarryPathTarget, CarryPathTarget, SiteCarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Crystal extends MaterialEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.CRYSTAL)
        this.sceneEntity = new CrystalSceneEntity(sceneMgr)
    }

    findCarryTargets(): CarryPathTarget[] {
        const sites = this.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => new SiteCarryPathTarget(s, s.getRandomDropPosition()))
        const powerStations = this.entityMgr.getBuildingsByType(EntityType.POWER_STATION)
        if (powerStations.length > 0) return powerStations.map((b) => new BuildingCarryPathTarget(b))
        const toolStations = this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION)
        return toolStations.map((b) => new BuildingCarryPathTarget(b))
    }

    get stats() {
        return ResourceManager.stats.PowerCrystal
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityCrystal
    }

}
