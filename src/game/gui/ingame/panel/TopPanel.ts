import { Button } from '../../base/button/Button'
import { Panel } from './Panel'
import { PanelCfg } from '../../../../cfg/PanelsCfg'
import { BaseConfig } from '../../../../cfg/BaseConfig'
import { ButtonCfg } from '../../../../cfg/ButtonsCfg'
import { ToggleButton } from '../../base/button/ToggleButton'

export class TopPanel extends Panel {

    btnCallToArms: ToggleButton
    btnOptions: Button
    btnPriorities: ToggleButton

    constructor(panelCfg: PanelCfg, buttonsCfg: ButtonTopCfg) {
        super(panelCfg)
        this.btnCallToArms = this.addChild(new ToggleButton(this, buttonsCfg.panelButtonTopPanelCallToArms))
        this.btnOptions = this.addChild(new Button(this, buttonsCfg.panelButtonTopPanelOptions))
        this.btnPriorities = this.addChild(new ToggleButton(this, buttonsCfg.panelButtonTopPanelPriorities))
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
