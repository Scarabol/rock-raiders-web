import { CfgEntry, CfgEntryValue } from './CfgEntry'

export interface ConfigSetFromRecord {
    setFromRecord(cfgValue: CfgEntry): this
}

export interface ConfigSetFromEntryValue {
    setFromValue(cfgValue: CfgEntryValue): this
}
