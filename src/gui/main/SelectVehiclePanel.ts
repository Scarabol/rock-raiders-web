import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectVehiclePanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(7, onBackPanel)
    }

}
