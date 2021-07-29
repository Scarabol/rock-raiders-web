import { RaiderActivity } from '../../activities/RaiderActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
import { FulfillerEntity } from '../../FulfillerEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'

export class UpgradeRaiderJob extends RaiderJob {
    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(building: BuildingEntity) {
        super()
        this.building = building
        this.workplaces = building.getTrainingTargets()
    }

    getWorkplaces(): PathTarget[] {
        return this.building.isPowered() ? this.workplaces : []
    }

    onJobComplete() {
        super.onJobComplete()
        if (this.raider.level < this.raider.stats.Levels) this.raider.level++
    }

    getWorkActivity(): RaiderActivity {
        return RaiderActivity.Train
    }

    getWorkDuration(fulfiller: FulfillerEntity): number {
        return 30000 // XXX adjust upgrade time
    }
}
