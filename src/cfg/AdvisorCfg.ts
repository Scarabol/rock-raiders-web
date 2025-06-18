import { ConfigSetFromEntryValue } from './Configurable'
import { CfgEntryValue } from './CfgEntry'

export class AdvisorTypeCfg implements ConfigSetFromEntryValue {
    animFileName: string = ''
    loopStart: number = 0 // seconds
    loopEnd: number = 0 // seconds

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(',', 3)
        this.animFileName = array[0].toFileName()
        this.loopStart = array[1].toNumber()
        this.loopEnd = array[2].toNumber()
        return this
    }
}

export class AdvisorPositionCfg implements ConfigSetFromEntryValue {
    advisorType: string = ''
    null: string = '' // NULL // unused and unknown meaning
    sfx: string = '' // SFX_NULL // unused and unknown meaning
    x: number = 0
    y: number = 0
    panel: string = ''

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(',', 6)
        this.advisorType = array[0].toFileName()
        this.null = array[1].toString()
        this.sfx = array[2].toString()
        this.x = array[3].toNumber()
        this.y = array[4].toNumber()
        this.panel = array[5].toString()
        return this
    }
}
