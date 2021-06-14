import { PathTarget } from '../../PathTarget'
import { Raider } from '../../raider/Raider'
import { Job } from '../Job'
import { JobState } from '../JobState'

export abstract class RaiderJob extends Job {

    raider: Raider

    abstract getWorkplaces(): PathTarget[]

    assign(raider: Raider) {
        if (this.raider === raider) return
        if (this.raider) throw new Error('Job already assigned')
        this.raider = raider
    }

    unAssign(raider: Raider) {
        if (this.raider !== raider) return
        this.raider = null
    }

    cancel() {
        this.jobState = JobState.CANCELED
        this.raider?.stopJob()
    }

}
