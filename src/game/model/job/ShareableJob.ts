import { FulfillerEntity } from '../FulfillerEntity'
import { Job } from './Job'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'

export abstract class ShareableJob extends Job {

    fulfiller: FulfillerEntity[] = []

    abstract getPriorityIdentifier(): PriorityIdentifier

    assign(fulfiller: FulfillerEntity) {
        const index = this.fulfiller.indexOf(fulfiller)
        if (fulfiller && index === -1) {
            this.fulfiller.push(fulfiller)
        }
    }

    unAssign(fulfiller: FulfillerEntity) {
        this.fulfiller.remove(fulfiller)
    }

    cancel() {
        this.jobState = JobState.CANCELED
        const fulfiller = this.fulfiller // ensure consistency while processing
        this.fulfiller = []
        fulfiller.forEach((fulfiller) => fulfiller.stopJob())
    }

}
