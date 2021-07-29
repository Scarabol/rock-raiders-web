import { BaseConfig } from './BaseConfig'
import { ButtonCfg } from './ButtonCfg'

export class ButtonInformationCfg extends BaseConfig {
    panelButtonInformationToggle: ButtonCfg = null
    panelButtonInformationFunction: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}
