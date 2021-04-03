import { Button } from '../../base/button/Button'
import { Panel } from './Panel'
import { PanelCfg } from '../../../../cfg/PanelsCfg'
import { ButtonCfg } from '../../../../cfg/ButtonsCfg'
import { BaseConfig } from '../../../../cfg/BaseConfig'

export class InfoDockPanel extends Panel {

    btnGoto: Button
    btnClose: Button

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonInfoDockCfg) {
        super(panelCfg)
        this.btnGoto = this.addChild(new Button(this, buttonsCfg.panelButtonInfoDockGoto))
        this.btnClose = this.addChild(new Button(this, buttonsCfg.panelButtonInfoDockClose))
    }

}

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
