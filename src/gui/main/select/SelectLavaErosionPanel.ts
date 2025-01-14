import { EventKey } from '../../../event/EventKeyEnum'
import { RepairLava } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectLavaErosionPanel extends IconSubPanel {
    private hasRepairLava: boolean = false

    constructor(onBackPanel: Panel) {
        super(1, onBackPanel)
        const cancelBuilding = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_RepairLava')
        cancelBuilding.isDisabled = () => this.hasRepairLava
        cancelBuilding.onClick = () => this.publishEvent(new RepairLava())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.hasRepairLava = event.hasRepairLava
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.hasRepairLava = false
    }
}
