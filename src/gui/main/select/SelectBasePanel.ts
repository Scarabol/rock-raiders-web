import { RemoveSelection } from '../../../event/GuiCommand'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'

export class SelectBasePanel extends IconSubPanel {
    constructor(numOfItems: number, onBackPanel: Panel) {
        super(numOfItems, onBackPanel)
        this.backBtn.onClick = () => this.publishEvent(new RemoveSelection())
    }
}
