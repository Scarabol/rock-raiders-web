import { RaiderActivity } from '../activities/RaiderActivity'
import { FulfillerEntity } from '../FulfillerEntity'
import { Surface } from '../map/Surface'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { JobState } from './JobState'

export abstract class Job {
    jobState: JobState = JobState.INCOMPLETE
    surface: Surface = null

    abstract assign(fulfiller: FulfillerEntity): void

    abstract unAssign(fulfiller: FulfillerEntity): void

    cancel() {
        this.jobState = JobState.CANCELED
    }

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

    abstract getWorkplaces(): PathTarget[]

    setActualWorkplace(target: PathTarget) {
    }

    getCarryItem(): MaterialEntity {
        return null
    }

    getWorkActivity(): RaiderActivity {
        return null
    }

    getWorkDuration(fulfiller: FulfillerEntity): number {
        return null
    }
}
