import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { BarrierActivity } from '../activities/BarrierActivity'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { BarrierLocation } from './BarrierLocation'
import { CarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Barrier extends MaterialEntity {

    heading: number

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager, location: BarrierLocation, site: BuildingSite) {
        super(worldMgr, sceneMgr, EntityType.BARRIER, 'MiscAnims/Barrier/Barrier.ae')
        this.heading = location.heading
        this.priorityIdentifier = PriorityIdentifier.aiPriorityConstruction
        this.changeActivity()
        this.targets = [new CarryPathTarget(location.location, site, null)]
    }

    protected updateTargets(): CarryPathTarget[] {
        return this.targets // TODO check target site still requires barrier, otherwise choose toolstation
    }

    getDefaultActivity(): BarrierActivity {
        return BarrierActivity.Short
    }

    onAddToSite() {
        super.onAddToSite()
        this.group.rotation.y = this.heading
        this.changeActivity(BarrierActivity.Expand, () => this.changeActivity(BarrierActivity.Long))
    }

}
