import { RaiderActivity } from '../activities/RaiderActivity'
import { MaterialEntity } from '../collect/MaterialEntity'
import { FulfillerEntity } from '../FulfillerEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { JobState } from './JobState'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'

export abstract class Job {

    type: JobType
    jobstate: JobState
    fulfiller: FulfillerEntity[] = []

    protected constructor(type: JobType) {
        this.type = type
        this.jobstate = JobState.INCOMPLETE
    }

    assign(fulfiller: FulfillerEntity) {
        const index = this.fulfiller.indexOf(fulfiller)
        if (fulfiller && index === -1) {
            this.fulfiller.push(fulfiller)
        }
    }

    unassign(fulfiller: FulfillerEntity) {
        this.fulfiller.remove(fulfiller)
    }

    cancel() {
        this.jobstate = JobState.CANCELED
        const fulfiller = this.fulfiller // ensure consistency while processing
        this.fulfiller = []
        fulfiller.forEach((fulfiller) => fulfiller.stopJob())
    }

    getRequiredTool(): RaiderTool {
        return null
    }

    getRequiredTraining(): RaiderTraining {
        return null
    }

    isReadyToComplete(): boolean {
        return true
    }

    onJobComplete() {
        this.jobstate = JobState.COMPLETE
    }

    abstract getWorkplaces(): PathTarget[];

    setActualWorkplace(target: PathTarget) {
    }

    getCarryItem(): MaterialEntity {
        return null
    }

    getWorkActivity(): RaiderActivity {
        return null
    }

    getWorkDuration(): number {
        return null
    }

}

export abstract class PublicJob extends Job {

    abstract getPriorityIdentifier(): PriorityIdentifier

}
