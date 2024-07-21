import { BaseConfig } from './BaseConfig'
import { ButtonCfg } from './ButtonCfg'

export class PriorityButtonsCfg extends BaseConfig {
    aiPriorityTrain?: ButtonCfg
    aiPriorityGetIn?: ButtonCfg
    aiPriorityCrystal?: ButtonCfg
    aiPriorityOre?: ButtonCfg
    aiPriorityRepair?: ButtonCfg
    aiPriorityClearing?: ButtonCfg
    aiPriorityDestruction?: ButtonCfg
    aiPriorityConstruction?: ButtonCfg
    aiPriorityReinforce?: ButtonCfg
    aiPriorityRecharge?: ButtonCfg

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
