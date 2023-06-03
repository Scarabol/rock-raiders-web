import { SupervisedJob } from '../../Supervisor'
import { AbstractJob, JobFulfiller } from './Job'
import { PriorityIdentifier } from './PriorityIdentifier'

export abstract class ShareableJob extends AbstractJob implements SupervisedJob {
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
}
