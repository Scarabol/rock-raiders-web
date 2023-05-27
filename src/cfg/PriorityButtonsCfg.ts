import { BaseConfig } from './BaseConfig'
import { ButtonCfg } from './ButtonCfg'

export class PriorityButtonsCfg extends BaseConfig {
    aiPriorityTrain: ButtonCfg = null
    aiPriorityGetIn: ButtonCfg = null
    aiPriorityCrystal: ButtonCfg = null
    aiPriorityOre: ButtonCfg = null
    aiPriorityRepair: ButtonCfg = null
    aiPriorityClearing: ButtonCfg = null
    aiPriorityDestruction: ButtonCfg = null
    aiPriorityConstruction: ButtonCfg = null
    aiPriorityReinforce: ButtonCfg = null
    aiPriorityRecharge: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): ButtonCfg {
        const [tooltipText, tooltipSfx] = Array.ensure(cfgValue[0])
        return {
            normalFile: cfgValue[1],
            highlightFile: cfgValue[1],
            pressedFile: cfgValue[2],
            disabledFile: cfgValue[3],
            tooltipText: tooltipText,
            tooltipSfx: tooltipSfx,
        }
    }
}

export class PrioritiesImagePositionsCfg extends BaseConfig {
    positionByIndex: PriorityPositionsEntry[] = []

    setFromCfgObj(cfgObj: any, createMissing: boolean = false): this {
        this.positionByIndex = Object.values(cfgObj).map(cfgValue => new PriorityPositionsEntry(cfgValue))
        return this
    }
}

export class PriorityPositionsEntry {
    x: number
    y: number

    constructor(cfgValue: any) {
        [this.x, this.y] = cfgValue
    }
}
