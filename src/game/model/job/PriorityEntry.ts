import { PriorityIdentifier } from './PriorityIdentifier'

export class PriorityEntry {
    key: PriorityIdentifier
    enabled: boolean

    constructor(other: PriorityEntry) {
        this.key = other.key
        this.enabled = other.enabled
    }
}
