import { EventKey } from '../../../event/EventKeyEnum'
import { RepairLava } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { ResourceManager } from '../../../resource/ResourceManager'

export class SelectLavaErosionPanel extends SelectBasePanel {
    private hasRepairLava: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 1, onBackPanel)
        const cancelBuilding = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_RepairLava')
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
