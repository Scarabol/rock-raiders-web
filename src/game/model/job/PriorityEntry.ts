import { LevelPrioritiesEntryConfig } from '../../../cfg/LevelsCfg'
import { PriorityIdentifier } from './PriorityIdentifier'

export class PriorityEntry {
    key: PriorityIdentifier
    enabled: boolean

    constructor(levelPriorityEntry: LevelPrioritiesEntryConfig) {
        this.key = levelPriorityEntry.key
        this.enabled = levelPriorityEntry.enabled
    }
}
