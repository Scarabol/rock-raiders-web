import { BarrierSceneEntity } from '../../../scene/entities/BarrierSceneEntity'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { CarryPathTarget } from '../job/carry/CarryPathTarget'
import { SiteCarryPathTarget } from '../job/carry/SiteCarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { BarrierLocation } from './BarrierLocation'
import { MaterialEntity } from './MaterialEntity'
import { WorldManager } from '../../WorldManager'

export class Barrier extends MaterialEntity {
    targets: SiteCarryPathTarget[]

    constructor(worldMgr: WorldManager, location: BarrierLocation, site: BuildingSite) {
        super(worldMgr, EntityType.BARRIER)
        this.sceneEntity = new BarrierSceneEntity(this.worldMgr.sceneMgr)
        this.targets = [new SiteCarryPathTarget(site, location.position, location.heading)]
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.targets.every((t) => t.isInvalid())) {
            return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        } else {
            return this.targets
        }
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.CONSTRUCTION
    }
}
