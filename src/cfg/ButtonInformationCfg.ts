import { BaseConfig } from './BaseConfig'
import { ButtonCfg } from './ButtonCfg'

export class ButtonInformationCfg extends BaseConfig {
    panelButtonInformationToggle: ButtonCfg = null
    panelButtonInformationFunction: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}
