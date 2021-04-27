import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonCfg'

export class PriorityButtonsConfig extends BaseConfig {

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

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): ButtonCfg {
        return {
            buttonType: cfgValue[0],
            normalFile: cfgValue[1],
            highlightFile: cfgValue[1],
            pressedFile: cfgValue[2],
            disabledFile: cfgValue[3],
        }
    }

}
