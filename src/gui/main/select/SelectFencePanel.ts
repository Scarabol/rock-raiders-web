import { BeamUpFence } from '../../../event/GuiCommand'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectFencePanel extends IconSubPanel {
    constructor(onBackPanel: Panel) {
        super(1, onBackPanel, true)
        const beamUpFence = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_DeleteElectricFence')
        beamUpFence.isDisabled = () => false
        beamUpFence.onClick = () => this.publishEvent(new BeamUpFence())
    }
}
