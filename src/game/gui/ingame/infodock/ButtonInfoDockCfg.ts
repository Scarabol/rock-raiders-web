import { BaseConfig } from '../../../../cfg/BaseConfig'
import { ButtonCfg } from '../../../../cfg/ButtonsCfg'

export class ButtonInfoDockCfg extends BaseConfig {

    panelButtonInfoDockGoto: ButtonCfg = null
    panelButtonInfoDockClose: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }

}
