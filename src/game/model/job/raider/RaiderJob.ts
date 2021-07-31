import { Raider } from '../../raider/Raider'
import { AbstractJob } from '../Job'

export abstract class RaiderJob extends AbstractJob {
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
}
