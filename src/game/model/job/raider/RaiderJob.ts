import { Raider } from '../../raider/Raider'
import { Job } from '../Job'

export abstract class RaiderJob extends Job {
    raider: Raider

    assign(raider: Raider) {
        if (this.raider === raider) return
        if (this.raider) throw new Error('Job already assigned')
        this.raider = raider
    }

    unAssign(raider: Raider) {
        if (this.raider !== raider) return
        this.raider = null
    }

    hasFulfiller(): boolean {
        return !!this.raider
    }
}
