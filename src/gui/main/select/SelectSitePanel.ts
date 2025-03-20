import { CancelBuilding } from '../../../event/GuiCommand'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectSitePanel extends IconSubPanel {
    constructor(onBackPanel: Panel) {
        super(1, onBackPanel, true)
        const cancelBuilding = this.addMenuItem(GameConfig.instance.interfaceImages.cancelConstruction)
        cancelBuilding.isDisabled = () => false
        cancelBuilding.onClick = () => this.publishEvent(new CancelBuilding())
    }
}
