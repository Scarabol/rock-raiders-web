import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { EventBroker } from '../../../event/EventBroker'
import { DeselectAll, GuiBackButtonClicked } from '../../../event/LocalEvents'

export class SelectBasePanel extends IconSubPanel {
    constructor(numOfItems: number, onBackPanel: Panel) {
        super(numOfItems, onBackPanel)
        this.backBtn.onClick = () => {
            this.publishEvent(new DeselectAll())
            EventBroker.publish(new GuiBackButtonClicked())
        }
    }
}
