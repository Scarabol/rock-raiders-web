import { LevelPrioritiesEntryConfig } from '../../../cfg/LevelsCfg'

export class PriorityList {

    levelDefault: PriorityEntry[] = []
    current: PriorityEntry[] = []

    constructor(priorities: LevelPrioritiesEntryConfig[]) {
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
        this.current = this.levelDefault.map(entry => new PriorityEntry(entry)) // deep copy required
    }

    pushToTop(index: number) {
        const element = this.current[index]
        for (let c = index; c > 0; c--) {
            this.current[c] = this.current[c - 1]
        }
        this.current[0] = element
    }

}

export class PriorityEntry {

    key: string
    enabled: boolean

    constructor(levelPriorityEntry: LevelPrioritiesEntryConfig) {
        this.key = levelPriorityEntry.key
        this.enabled = levelPriorityEntry.enabled
    }

}
