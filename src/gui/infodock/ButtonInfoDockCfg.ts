import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonCfg'

export class ButtonInfoDockCfg extends BaseConfig {
    panelButtonInfoDockGoto: ButtonCfg = null
    panelButtonInfoDockClose: ButtonCfg = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }
}
