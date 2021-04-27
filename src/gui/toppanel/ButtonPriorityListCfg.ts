import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonCfg'

export class ButtonPriorityListCfg extends BaseConfig {

    panelButtonPriorityListDisable: ButtonCfg[] = []
    panelButtonPriorityListUpOne: ButtonCfg[] = []
    panelButtonPriorityListClose: ButtonCfg = null // not used in the game
    panelButtonPriorityListReset: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        if (lCfgKeyName.match(/panelButtonPriorityListDisable\d+/i)) {
            this.panelButtonPriorityListDisable.push(this.parseValue(lCfgKeyName, cfgValue))
            return true
        } else if (lCfgKeyName.match(/panelButtonPriorityListUpOne\d+/i)) {
            this.panelButtonPriorityListUpOne.push(this.parseValue(lCfgKeyName, cfgValue))
            return true
        } else {
            return super.assignValue(objKey, lCfgKeyName, cfgValue)
        }
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }

}
