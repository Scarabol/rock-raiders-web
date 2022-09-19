import { CrystalSceneEntity } from '../../../scene/entities/CrystalSceneEntity'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { MaterialEntity } from './MaterialEntity'

export class Crystal extends MaterialEntity {
    constructor(worldMgr: WorldManager) {
        super(worldMgr, EntityType.CRYSTAL, PriorityIdentifier.CRYSTAL, RaiderTraining.NONE)
        this.sceneEntity = new CrystalSceneEntity(this.worldMgr.sceneMgr)
        this.sceneEntity.pickSphere.userData = {entityType: EntityType.CRYSTAL, materialEntity: this}
    }

    findCarryTargets(): PathTarget[] {
        const sites = this.worldMgr.entityMgr.buildingSites.filter((b) => b.needs(this.entityType))
        if (sites.length > 0) return sites.map((s) => PathTarget.fromSite(s.getRandomDropPosition(), s))
        const powerStations = this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.POWER_STATION)
        if (powerStations.length > 0) return powerStations
        return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
    }
}
