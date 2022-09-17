import { CrystalSceneEntity } from '../../../scene/entities/CrystalSceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { SiteCarryPathTarget } from '../job/carry/SiteCarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'

export class Crystal extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.CRYSTAL, PriorityIdentifier.CRYSTAL, RaiderTraining.NONE)
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
}
