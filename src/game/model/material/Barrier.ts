import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { BarrierActivity } from '../activities/BarrierActivity'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { BarrierLocation } from './BarrierLocation'
import { BuildingCarryPathTarget, CarryPathTarget, SiteCarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Barrier extends MaterialEntity {

    site: BuildingSite
    heading: number

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, location: BarrierLocation, site: BuildingSite) {
        super(sceneMgr, entityMgr, EntityType.BARRIER, 'MiscAnims/Barrier/Barrier.ae')
        this.site = site
        this.heading = location.heading
        this.priorityIdentifier = PriorityIdentifier.aiPriorityConstruction
        this.changeActivity()
        this.targets = [new SiteCarryPathTarget(location.location, this.site)]
    }

    protected updateTargets(): CarryPathTarget[] {
        if (this.site?.canceled) {
            this.site = null
            const closestToolstation = this.entityMgr.getClosestBuildingByType(this.getPosition(), EntityType.TOOLSTATION)
            this.targets = [new BuildingCarryPathTarget(closestToolstation)]
        }
        return this.targets
    }

    getDefaultActivity(): BarrierActivity {
        return BarrierActivity.Short
    }

    onAddToSite() {
        super.onAddToSite()
        this.sceneEntity.setHeading(this.heading)
        this.changeActivity(BarrierActivity.Expand, () => this.changeActivity(BarrierActivity.Long))
    }

}
