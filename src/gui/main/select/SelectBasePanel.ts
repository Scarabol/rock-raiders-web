import { RemoveSelection } from '../../../event/GuiCommand'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { EventBroker } from '../../../event/EventBroker'
import { GuiButtonClicked } from '../../../event/LocalEvents'
import { EventKey } from '../../../event/EventKeyEnum'

export class SelectBasePanel extends IconSubPanel {
    constructor(numOfItems: number, onBackPanel: Panel) {
        super(numOfItems, onBackPanel)
        this.backBtn.onClick = () => {
            this.publishEvent(new RemoveSelection())
            EventBroker.publish(new GuiButtonClicked(EventKey.GUI_GO_BACK_BUTTON_CLICKED))
        }
    }
}
