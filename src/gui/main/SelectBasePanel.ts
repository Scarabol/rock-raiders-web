import { DeselectAll } from '../../event/LocalEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class SelectBasePanel extends IconSubPanel {

    constructor(parent: BaseElement, numOfItems, onBackPanel: Panel) {
        super(parent, numOfItems, onBackPanel)
        this.backBtn.onClick = () => this.publishEvent(new DeselectAll())
    }

}
