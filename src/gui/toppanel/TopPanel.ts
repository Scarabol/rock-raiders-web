import { ButtonTopCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { ToggleButton } from '../base/ToggleButton'

export class TopPanel extends Panel {
    btnCallToArms: ToggleButton
    btnOptions: Button
    btnPriorities: ToggleButton

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonTopCfg) {
        super(parent, panelCfg)
        this.btnCallToArms = this.addChild(new ToggleButton(this, buttonsCfg.panelButtonTopPanelCallToArms))
        this.btnOptions = this.addChild(new Button(this, buttonsCfg.panelButtonTopPanelOptions))
        this.btnPriorities = this.addChild(new ToggleButton(this, buttonsCfg.panelButtonTopPanelPriorities))
    }
}

