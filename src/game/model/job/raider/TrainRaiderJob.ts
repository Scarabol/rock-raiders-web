import { RaiderTrainingCompleteEvent } from '../../../../event/LocalEvents'
import { EntityManager } from '../../../EntityManager'
import { AnimationActivity, RaiderActivity } from '../../anim/AnimationActivity'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTraining } from '../../raider/RaiderTraining'
import { RaiderJob } from './RaiderJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { JobFulfiller } from '../Job'
import { EventBroker } from '../../../../event/EventBroker'
import { MoveJob } from '../MoveJob'
import { SurfaceType } from '../../../terrain/SurfaceType'
import { DEV_MODE } from '../../../../params'

export class TrainRaiderJob extends RaiderJob {
    building?: BuildingEntity
    workplaces: PathTarget[]

    constructor(readonly entityMgr: EntityManager, readonly training: RaiderTraining, building?: BuildingEntity | undefined) {
        super()
        this.building = building
        this.workplaces = this.building?.getTrainingTargets() || []
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (!this.building?.isPowered()) this.workplaces = this.entityMgr.getTrainingSiteTargets(this.training)
        const target = entity.findShortestPath(this.workplaces)?.target
        this.building = target?.building
        return target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        if (!this.raider) return
        this.raider.addTraining(this.training)
        EventBroker.publish(new RaiderTrainingCompleteEvent(this.training))
        if (!this.raider.followUpJob && this.building) {
            const pathSurface = this.building.primaryPathSurface?.neighbors.find((n) => n.surfaceType === SurfaceType.POWER_PATH)
            if (pathSurface) {
                this.raider.followUpJob = new MoveJob(pathSurface.getRandomPosition())
            } else {
                const walkableSurface = this.building.primaryPathSurface?.neighbors.find((n) => n.isWalkable())
                if (walkableSurface) this.raider.followUpJob = new MoveJob(walkableSurface.getRandomPosition())
            }
        }
    }

    getWorkActivity(): AnimationActivity {
        return RaiderActivity.Train
    }

    getExpectedTimeLeft(): number {
        return DEV_MODE ? 2000 : 10000 // XXX balance training time
    }

    getJobBubble(): keyof BubblesCfg {
        return 'bubbleTrain'
    }
}
