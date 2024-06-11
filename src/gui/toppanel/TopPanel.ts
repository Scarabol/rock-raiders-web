import { ButtonTopCfg } from '../../cfg/ButtonsCfg'
import { PanelCfg } from '../../cfg/PanelCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { ToggleButton } from '../base/ToggleButton'
import { ToggleAlarmEvent } from '../../event/WorldEvents'
import { ShowOptionsEvent } from '../../event/LocalEvents'
import { EventKey } from '../../event/EventKeyEnum'

export class TopPanel extends Panel {
    btnCallToArms: ToggleButton
    btnOptions: Button
    btnPriorities: ToggleButton

    constructor(parent: BaseElement, panelCfg: PanelCfg, buttonsCfg: ButtonTopCfg) {
        super(parent, panelCfg)
        this.btnCallToArms = this.addChild(new ToggleButton(this, buttonsCfg.panelButtonTopPanelCallToArms))
        this.btnCallToArms.onClick = () => {
            this.publishEvent(new ToggleAlarmEvent(this.btnCallToArms.toggleState))
        }
        this.registerEventListener(EventKey.TOGGLE_ALARM, (event: ToggleAlarmEvent) => {
            this.btnCallToArms.setToggleState(event.alarmState)
        })
        this.btnOptions = this.addChild(new Button(this, buttonsCfg.panelButtonTopPanelOptions))
        this.btnOptions.onClick = () => {
            this.publishEvent(new ShowOptionsEvent())
        }
        this.btnPriorities = this.addChild(new ToggleButton(this, buttonsCfg.panelButtonTopPanelPriorities))
    }
}
