import { Button } from '../../base/button/Button'
import { Panel } from './Panel'
import { PanelCfg } from '../../../../cfg/PanelsCfg'
import { BaseConfig } from '../../../../cfg/BaseConfig'
import { ButtonCfg } from '../../../../cfg/ButtonsCfg'

export class TopPanel extends Panel {

    btnCallToArms: Button
    btnOptions: Button
    btnPriorities: Button

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonTopCfg) {
        super(panelCfg)
        this.btnCallToArms = this.addChild(new Button(this, buttonsCfg.panelButtonTopPanelCallToArms)) // FIXME use toggle button
        this.btnOptions = this.addChild(new Button(this, buttonsCfg.panelButtonTopPanelOptions))
        this.btnPriorities = this.addChild(new Button(this, buttonsCfg.panelButtonTopPanelPriorities)) // FIXME use toggle button
    }

}

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
