import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
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

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Train
    }

    getExpectedTimeLeft(): number {
        return 30000 // XXX adjust upgrade time
    }
}
