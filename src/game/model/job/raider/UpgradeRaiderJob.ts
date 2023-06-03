import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'

export class UpgradeRaiderJob extends RaiderJob {
    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(building: BuildingEntity) {
        super()
        this.building = building
        this.workplaces = building.getTrainingTargets()
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (!this.building.isPowered()) return null
        return this.workplaces
            .map((b) => entity.findPathToTarget(b))
            .filter((t) => !!t)
            .sort((l, r) => l.lengthSq - r.lengthSq)[0].target
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
