import { BaseConfig } from './BaseConfig'

export class AdvisorTypeCfg extends BaseConfig {
    animFileName: string
    loopStart: number // seconds
    loopEnd: number // seconds

    constructor(cfgValue: any) {
        super()
        ;[this.animFileName, this.loopStart, this.loopEnd] = cfgValue
    }
}

export class AdvisorPositionCfg extends BaseConfig {
    advisorType: string
    null: null // NULL // unused and unknown meaning
    sfx: null // SFX_NULL // unused and unknown meaning
    x: number
    y: number
    panel: string

    constructor(cfgValue: any) {
        super()
        ;[this.advisorType, this.null, this.sfx, this.x, this.y, this.panel] = cfgValue
    }
}
