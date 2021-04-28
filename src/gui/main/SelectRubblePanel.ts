import { EventKey } from '../../event/EventKeyEnum'
import { CreateClearRubbleJob } from '../../event/GuiCommand'
import { SelectionChanged } from '../../event/LocalEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectRubblePanel extends SelectBasePanel {

    hasRubble: boolean = false
    canPlaceFence: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 2, onBackPanel)
        const clearRubbleItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_ClearRubble')
        clearRubbleItem.isDisabled = () => !this.hasRubble
        clearRubbleItem.onClick = () => this.publishEvent(new CreateClearRubbleJob())
        const placeFenceItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        placeFenceItem.isDisabled = () => !this.canPlaceFence
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.hasRubble = event.hasRubble
            this.canPlaceFence = event.canPlaceFence
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.hasRubble = false
        this.canPlaceFence = false
    }

}
