import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonCfg'

export class ButtonPriorityListCfg extends BaseConfig {
    panelButtonPriorityListDisable: ButtonCfg[] = []
    panelButtonPriorityListUpOne: ButtonCfg[] = []
    panelButtonPriorityListClose: ButtonCfg = null // not used in the game
    panelButtonPriorityListReset: ButtonCfg = null

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (unifiedKey.match(/panelButtonPriorityListDisable\d+/i)) {
            this.panelButtonPriorityListDisable.push(this.parseValue(unifiedKey, cfgValue))
            return true
        } else if (unifiedKey.match(/panelButtonPriorityListUpOne\d+/i)) {
            this.panelButtonPriorityListUpOne.push(this.parseValue(unifiedKey, cfgValue))
            return true
        } else {
            return super.assignValue(objKey, unifiedKey, cfgValue)
        }
    }

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}
