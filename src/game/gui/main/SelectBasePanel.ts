import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'
import { EventBus } from '../../../event/EventBus'
import { EntityDeselected } from '../../../event/LocalEvents'

export class SelectBasePanel extends IconSubPanel {

    constructor(numOfItems, onBackPanel: Panel) {
        super(numOfItems, onBackPanel)
        this.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
    }

}
