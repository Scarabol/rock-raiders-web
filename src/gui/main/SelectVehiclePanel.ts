import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectVehiclePanel extends SelectBasePanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 7, onBackPanel)
    }

}
