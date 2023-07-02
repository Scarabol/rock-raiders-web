import { EventKey } from '../../../event/EventKeyEnum'
import { CreateClearRubbleJob, PlaceFence } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityType } from '../../../game/model/EntityType'

export class SelectRubblePanel extends SelectBasePanel {
    hasRubble: boolean = false
    canPlaceFence: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 2, onBackPanel)
        const clearRubbleItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_ClearRubble')
        clearRubbleItem.isDisabled = () => !this.hasRubble
        clearRubbleItem.onClick = () => this.publishEvent(new CreateClearRubbleJob())
        const placeFenceItem = this.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_PlaceFence')
        placeFenceItem.addDependencyCheck(EntityType.ELECTRIC_FENCE)
        placeFenceItem.isDisabled = () => !this.canPlaceFence
        placeFenceItem.onClick = () => this.publishEvent(new PlaceFence())
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
