import { ResourceManager } from '../../../resource/ResourceManager'
import { CrystalSceneEntity } from '../../../scene/entities/CrystalSceneEntity'
import { EntityType } from '../EntityType'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { SiteCarryPathTarget } from '../job/carry/SiteCarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { MaterialEntity } from './MaterialEntity'
import { WorldManager } from '../../WorldManager'

export class Crystal extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.CRYSTAL)
        this.sceneEntity = new CrystalSceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.pickSphere.userData = {entityType: EntityType.CRYSTAL, materialEntity: this}
    }

    findCarryTargets(): CarryPathTarget[] {
        const sites = this.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => new SiteCarryPathTarget(s, s.getRandomDropPosition()))
        const powerStations = this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.POWER_STATION)
        if (powerStations.length > 0) return powerStations
        return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }

    get stats() {
        return ResourceManager.configuration.stats.PowerCrystal
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.CRYSTAL
    }
}
