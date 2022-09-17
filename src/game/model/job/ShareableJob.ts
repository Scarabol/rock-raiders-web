import { SupervisedJob } from '../../Supervisor'
import { AbstractJob, CancelableJob, JobFulfiller } from './Job'
import { JobState } from './JobState'
import { PriorityIdentifier } from './PriorityIdentifier'

export abstract class ShareableJob extends AbstractJob implements SupervisedJob, CancelableJob {
    protected fulfiller: JobFulfiller[] = []

    abstract getPriorityIdentifier(): PriorityIdentifier

    assign(fulfiller: JobFulfiller) {
        const index = this.fulfiller.indexOf(fulfiller)
        if (fulfiller && index === -1) {
            this.fulfiller.push(fulfiller)
        }
    }

    unAssign(fulfiller: JobFulfiller) {
        this.fulfiller.remove(fulfiller)
    }

    hasFulfiller(): boolean {
        return this.fulfiller.length > 0
    }

    cancel() {
        this.jobState = JobState.CANCELED
        const fulfiller = this.fulfiller // ensure consistency while processing
        this.fulfiller = []
        fulfiller.forEach((fulfiller) => fulfiller.stopJob())
    }
}
