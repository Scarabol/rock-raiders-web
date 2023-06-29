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

export type JobFulfiller = Raider | VehicleEntity

export interface Job {
    jobState: JobState
    surface: Surface
    carryItem: MaterialEntity

    assign(fulfiller: JobFulfiller): void

    unAssign(fulfiller: JobFulfiller): void

    getRequiredTool(): RaiderTool

    getRequiredTraining(): RaiderTraining

    isReadyToComplete(): boolean

    onJobComplete(): void

    getWorkplace(entity: Raider | VehicleEntity): PathTarget

    getWorkActivity(): AnimationActivity

    getExpectedTimeLeft(): number

    addProgress(fulfiller: JobFulfiller, elapsedMs: number): void

    getJobBubble(): keyof BubblesCfg
}

export abstract class AbstractJob implements Job {
    jobState: JobState = JobState.INCOMPLETE
    surface: Surface = null
    carryItem: MaterialEntity = null

    abstract assign(fulfiller: JobFulfiller): void

    abstract unAssign(fulfiller: JobFulfiller): void

    getRequiredTool(): RaiderTool {
        return RaiderTool.NONE
    }

    getRequiredTraining(): RaiderTraining {
        return RaiderTraining.NONE
    }

    isReadyToComplete(): boolean {
        return true
    }

    onJobComplete() {
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
