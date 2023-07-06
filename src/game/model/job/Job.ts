import { AnimationActivity } from '../anim/AnimationActivity'
import { Surface } from '../../terrain/Surface'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { Raider } from '../raider/Raider'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { JobState } from './JobState'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { PriorityIdentifier } from './PriorityIdentifier'

export type JobFulfiller = Raider | VehicleEntity

export abstract class Job {
    jobState: JobState = JobState.INCOMPLETE
    surface: Surface = null
    carryItem: MaterialEntity = null
    requiredTool: RaiderTool = RaiderTool.NONE
    requiredTraining: RaiderTraining = RaiderTraining.NONE
    priorityIdentifier: PriorityIdentifier = PriorityIdentifier.NONE

    abstract assign(fulfiller: JobFulfiller): void

    abstract unAssign(fulfiller: JobFulfiller): void

    abstract hasFulfiller(): boolean

    isReadyToComplete(): boolean {
        return true
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.jobState = JobState.COMPLETE
    }

    abstract getWorkplace(entity: Raider | VehicleEntity): PathTarget

    getWorkActivity(): AnimationActivity {
        return null
    }

    getExpectedTimeLeft(): number {
        return null
    }

    addProgress(fulfiller: JobFulfiller, elapsedMs: number) {
    }

    getJobBubble(): keyof BubblesCfg {
        return null
    }
}
