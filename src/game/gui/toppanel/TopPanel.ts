import { PanelCfg } from '../../../cfg/PanelsCfg'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { ToggleButton } from '../base/ToggleButton'
import { ButtonTopCfg } from './ButtonTopCfg'

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

