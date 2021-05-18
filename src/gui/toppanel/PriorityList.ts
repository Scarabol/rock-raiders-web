import { PriorityEntry } from '../../game/model/job/PriorityEntry'

export class PriorityList {

    levelDefault: PriorityEntry[] = []
    current: PriorityEntry[] = []

    setList(priorities: PriorityEntry[]) {
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

}
