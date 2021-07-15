import { ResourceManager } from '../../../resource/ResourceManager'
import { CrystalSceneEntity } from '../../../scene/entities/CrystalSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { SiteCarryPathTarget } from '../job/carry/SiteCarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'

export class Crystal extends MaterialEntity {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.CRYSTAL)
        this.sceneEntity = new CrystalSceneEntity(sceneMgr)
        this.sceneEntity.pickSphere.userData = {entityType: EntityType.CRYSTAL, materialEntity: this}
    }

    findCarryTargets(): CarryPathTarget[] {
        const sites = this.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => new SiteCarryPathTarget(s, s.getRandomDropPosition()))
        const powerStations = this.entityMgr.getBuildingCarryPathTargets(EntityType.POWER_STATION)
        if (powerStations.length > 0) return powerStations
        return this.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }

    get stats() {
        return ResourceManager.stats.PowerCrystal
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.CRYSTAL
    }

}
