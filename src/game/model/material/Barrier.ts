import { BarrierSceneEntity } from '../../../scene/entities/BarrierSceneEntity'
import { WorldManager } from '../../WorldManager'
import { BarrierActivity } from '../activities/BarrierActivity'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { SiteCarryPathTarget } from '../job/carry/SiteCarryPathTarget'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { BarrierLocation } from './BarrierLocation'
import { MaterialEntity } from './MaterialEntity'

export class Barrier extends MaterialEntity {
    constructor(worldMgr: WorldManager, readonly location: BarrierLocation, readonly site: BuildingSite) {
        super(worldMgr, EntityType.BARRIER, PriorityIdentifier.CONSTRUCTION, RaiderTraining.NONE)
        this.sceneEntity = new BarrierSceneEntity(this.worldMgr.sceneMgr)
    }

    findCarryTargets(): PathTarget[] {
        if (this.site.complete || this.site.canceled) {
            return this.worldMgr.entityMgr.getBuildingCarryPathTargets(EntityType.TOOLSTATION)
        } else {
            return [new SiteCarryPathTarget(this.site, this.location.position, this.location.heading)]
        }
    }

    disposeFromWorld() {
        this.sceneEntity.changeActivity(BarrierActivity.Teleport, () => super.disposeFromWorld())
    }
}
