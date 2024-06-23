import { CancelBuilding } from '../../../event/GuiCommand'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectSitePanel extends SelectBasePanel {
    constructor(onBackPanel: Panel) {
        super(1, onBackPanel)
        const cancelBuilding = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_CancelConstruction')
        cancelBuilding.isDisabled = () => false
        cancelBuilding.onClick = () => this.publishEvent(new CancelBuilding())
    }
}
