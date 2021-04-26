import { EventBus } from '../../event/EventBus'
import { EntityDeselected } from '../../event/LocalEvents'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class SelectBasePanel extends IconSubPanel {

    constructor(numOfItems, onBackPanel: Panel) {
        super(numOfItems, onBackPanel)
        this.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
    }

}
