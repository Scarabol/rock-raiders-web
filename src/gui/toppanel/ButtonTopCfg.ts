import { BaseConfig } from '../../cfg/BaseConfig'
import { ButtonCfg } from '../../cfg/ButtonCfg'

export class ButtonTopCfg extends BaseConfig {

    panelButtonTopPanelCallToArms: ButtonCfg = null
    panelButtonTopPanelOptions: ButtonCfg = null
    panelButtonTopPanelPriorities: ButtonCfg = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        return new ButtonCfg(cfgValue)
    }

}
