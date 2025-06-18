import { PriorityEntry } from '../../game/model/job/PriorityEntry'
import { EventBroker } from '../../event/EventBroker'
import { UpdatePriorities } from '../../event/WorldEvents'
import { PriorityIdentifier } from '../../game/model/job/PriorityIdentifier'

export class PriorityList {
    readonly levelDefault: PriorityEntry[] = []
    readonly current: PriorityEntry[] = []

    setList(priorities: PriorityEntry[]) {
        this.levelDefault.length = 0
        this.levelDefault.push(...priorities)
        this.reset()
    }

    toggle(index: number) {
        this.current[index].enabled = !this.current[index].enabled
        EventBroker.publish(new UpdatePriorities(this.current))
    }

    upOne(index: number) {
        const tmp = this.current[index]
        this.current[index] = this.current[index + 1]
        this.current[index + 1] = tmp
        EventBroker.publish(new UpdatePriorities(this.current))
    }

    reset() {
        this.current.length = 0
        this.current.push(...this.levelDefault.map((entry) => new PriorityEntry(entry))) // use deep copy to avoid interference
        EventBroker.publish(new UpdatePriorities(this.current))
    }

    pushToTop(index: number) {
        const element = this.current[index]
        for (let c = index; c > 0; c--) {
            this.current[c] = this.current[c - 1]
        }
        this.current[0] = element
        EventBroker.publish(new UpdatePriorities(this.current))
    }

    setPriorityIndex(priorityIdentifier: PriorityIdentifier, targetIndex: number): void {
        if (targetIndex < 0 || targetIndex > 1) {
            console.warn('Unexpected target index for priority. Pushing to top anyway') // XXX Support other target indexes
        }
        const currentIndex = this.current.findIndex((p) => p.key === priorityIdentifier)
        if (currentIndex < 0) {
            console.warn(`Cannot change priority index for ${priorityIdentifier}. Index not found`)
            return
        }
        this.pushToTop(currentIndex)
        EventBroker.publish(new UpdatePriorities(this.current))
    }

    getPriority(priorityIdentifier: PriorityIdentifier): number {
        return this.current.findIndex((p) => p.key === priorityIdentifier)
    }

    isEnabled(priorityIdentifier: PriorityIdentifier): boolean {
        const priority = this.current.find((p) => p.key === priorityIdentifier)
        return !priority || priority.enabled
    }
}
