import { BaseConfig } from './BaseConfig'
import { BaseButtonCfg, ButtonCfg } from './ButtonCfg'
import { CfgHelper } from './CfgHelper'

export class PriorityButtonsCfg extends BaseConfig {
    aiPriorityTrain: ButtonCfg = new BaseButtonCfg()
    aiPriorityGetIn: ButtonCfg = new BaseButtonCfg()
    aiPriorityCrystal: ButtonCfg = new BaseButtonCfg()
    aiPriorityOre: ButtonCfg = new BaseButtonCfg()
    aiPriorityRepair: ButtonCfg = new BaseButtonCfg()
    aiPriorityClearing: ButtonCfg = new BaseButtonCfg()
    aiPriorityDestruction: ButtonCfg = new BaseButtonCfg()
    aiPriorityConstruction: ButtonCfg = new BaseButtonCfg()
    aiPriorityReinforce: ButtonCfg = new BaseButtonCfg()
    aiPriorityRecharge: ButtonCfg = new BaseButtonCfg()

    parseValue(unifiedKey: string, cfgValue: any): ButtonCfg {
        const [tooltipText, tooltipSfx] = Array.ensure(cfgValue[0])
        return Object.assign(new BaseButtonCfg(), {
            normalFile: cfgValue[1],
            highlightFile: cfgValue[1],
            pressedFile: cfgValue[2],
            disabledFile: cfgValue[3],
            tooltipText: CfgHelper.assertString(tooltipText),
            tooltipSfx: CfgHelper.assertString(tooltipSfx || ''),
        })
    }
}

export class PrioritiesImagePositionsCfg extends BaseConfig {
    positionByIndex: PriorityPositionsEntry[] = []

    setFromCfgObj(cfgObj: any): this {
        this.positionByIndex = Object.values(cfgObj).map(cfgValue => new PriorityPositionsEntry(cfgValue))
        return this
    }
}

export class PriorityPositionsEntry {
    x: number
    y: number

    constructor(cfgValue: any) {
        this.x = CfgHelper.assertNumber(cfgValue[0])
        this.y = CfgHelper.assertNumber(cfgValue[1])
    }
}
