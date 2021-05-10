import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { BarrierActivity } from '../activities/BarrierActivity'
import { BuildingSite } from '../building/BuildingSite'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { PriorityIdentifier } from '../job/PriorityIdentifier'
import { BarrierLocation } from './BarrierLocation'
import { BuildingCarryPathTarget, CarryPathTarget, SiteCarryPathTarget } from './CarryPathTarget'
import { MaterialEntity } from './MaterialEntity'

export class Barrier extends MaterialEntity {

    site: BuildingSite
    heading: number

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager, location: BarrierLocation, site: BuildingSite) {
        super(worldMgr, sceneMgr, EntityType.BARRIER, 'MiscAnims/Barrier/Barrier.ae')
        this.site = site
        this.heading = location.heading
        this.priorityIdentifier = PriorityIdentifier.aiPriorityConstruction
        this.changeActivity()
        this.targets = [new SiteCarryPathTarget(location.location, this.site)]
    }

    protected updateTargets(): CarryPathTarget[] {
        if (this.site?.canceled) {
            this.site = null
            const closestToolstation = GameState.getClosestBuildingByType(this.getPosition(), EntityType.TOOLSTATION)
            this.targets = [new BuildingCarryPathTarget(closestToolstation)]
        }
        return this.targets
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
