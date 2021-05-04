import { LevelPrioritiesEntryConfig } from '../../../cfg/LevelsCfg'
import { PublicJob } from './Job'
import { PriorityIdentifier } from './PriorityIdentifier'

export class PriorityList {

    levelDefault: PriorityEntry[] = []
    current: PriorityEntry[] = []

    setList(priorities: LevelPrioritiesEntryConfig[]) {
        this.levelDefault = priorities
        this.reset()
    }

    toggle(index: number) {
        this.current[index].enabled = !this.current[index].enabled
    }

    upOne(index: number) {
        const tmp = this.current[index]
        this.current[index] = this.current[index + 1]
        this.current[index + 1] = tmp
    }

    reset() {
        this.current = this.levelDefault.map(entry => new PriorityEntry(entry)) // use deep copy to avoid interference
    }

    pushToTop(index: number) {
        const element = this.current[index]
        for (let c = index; c > 0; c--) {
            this.current[c] = this.current[c - 1]
        }
        this.current[0] = element
    }

    getPriority(job: PublicJob) {
        let priority = 0
        this.current.some((j, index) => {
            if (j.key === job.getPriorityIdentifier()) {
                priority = index
                return true
            }
        })
        return priority
    }

    isEnabled(priorityIdentifier: PriorityIdentifier): boolean {
        return this.current.find((entry) => entry.key === priorityIdentifier)?.enabled || false
    }
}

export class PriorityEntry {

    key: PriorityIdentifier
    enabled: boolean

    constructor(levelPriorityEntry: LevelPrioritiesEntryConfig) {
        this.key = levelPriorityEntry.key
        this.enabled = levelPriorityEntry.enabled
    }

}
