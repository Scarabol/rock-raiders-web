import { BarrierSceneEntity } from '../../../scene/entities/BarrierSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { BarrierLocation } from './BarrierLocation'
import { BuildingCarryPathTarget, CarryPathTarget, SiteCarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Barrier extends MaterialEntity {

    targets: SiteCarryPathTarget[]

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, location: BarrierLocation, site: BuildingSite) {
        super(sceneMgr, entityMgr, EntityType.BARRIER)
        this.sceneEntity = new BarrierSceneEntity(sceneMgr)
        this.targets = [new SiteCarryPathTarget(site, location.position, location.heading)]
    }

    findCarryTargets(): CarryPathTarget[] {
        if (this.targets.every((t) => t.isInvalid())) {
            return this.entityMgr.getBuildingsByType(EntityType.TOOLSTATION).map((b) => new BuildingCarryPathTarget(b))
        } else {
            return this.targets
        }
    }

    getPriorityIdentifier(): PriorityIdentifier {
        return PriorityIdentifier.aiPriorityConstruction
    }

}
