import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { PathTarget } from '../../../scene/model/PathTarget'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { RaiderTool } from '../../../scene/model/RaiderTool'
import { JobState } from './JobState'
import { JobType } from './JobType'
import { PriorityIdentifier } from './PriorityIdentifier'

export abstract class Job {

    type: JobType
    jobstate: JobState
    fulfiller: FulfillerEntity[] = []

    protected constructor(type: JobType) {
        this.type = type
        this.jobstate = JobState.OPEN
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

    isQualified(fulfiller: FulfillerEntity): boolean {
        return true
    }

    isQualifiedWithTool(fulfiller: FulfillerEntity): RaiderTool {
        return null
    }

    isQualifiedWithTraining(fulfiller: FulfillerEntity): RaiderSkill {
        return null
    }

    onJobComplete() {
        this.jobstate = JobState.COMPLETE
    }

    abstract getWorkplaces(): PathTarget[];

}

export abstract class PublicJob extends Job {

    abstract getPriorityIdentifier(): PriorityIdentifier

}
