import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderJob } from './RaiderJob'
import { JobFulfiller } from '../Job'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { HealthComponent } from '../../../component/HealthComponent'
import { GameConfig } from '../../../../cfg/GameConfig'
import { DEV_MODE } from '../../../../params'

export class UpgradeRaiderJob extends RaiderJob {
    building: BuildingEntity
    workplaces: PathTarget[]

    constructor(building: BuildingEntity) {
        super()
        this.building = building
        this.workplaces = building.getTrainingTargets()
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.building.isPowered()) return undefined
        return entity.findShortestPath(this.workplaces)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        if (!this.raider) return
        if (this.raider.level < this.raider.stats.maxLevel) {
            this.raider.level++
            this.raider.worldMgr.ecs.getComponents(this.raider.entity).get(HealthComponent).rockFallDamage = GameConfig.instance.getRockFallDamage(this.raider.entityType, this.raider.level)
        }
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Train
    }

    getExpectedTimeLeft(): number {
        return DEV_MODE ? 2000 : 30000 // XXX balance upgrade time
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleUpgrade'
    }
}
