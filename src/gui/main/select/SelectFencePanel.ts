import { BeamUpFence } from '../../../event/GuiCommand'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectFencePanel extends SelectBasePanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 1, onBackPanel)
        const beamUpFence = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteElectricFence')
        beamUpFence.isDisabled = () => false
        beamUpFence.onClick = () => this.publishEvent(new BeamUpFence())
    }

}
