import { EventKey } from '../../../event/EventKeyEnum'
import { CreateClearRubbleJob, PlaceFence } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { EntityType } from '../../../game/model/EntityType'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectRubblePanel extends IconSubPanel {
    hasRubble: boolean = false
    canPlaceFence: boolean = false

    constructor(onBackPanel: Panel) {
        super(2, onBackPanel, true)
        const clearRubbleItem = this.addMenuItem(GameConfig.instance.interfaceImages.clearRubble)
        clearRubbleItem.isDisabled = () => !this.hasRubble
        clearRubbleItem.onClick = () => this.publishEvent(new CreateClearRubbleJob())
        const placeFenceItem = this.addMenuItem(GameConfig.instance.interfaceImages.placeFence)
        placeFenceItem.addDependencyCheck(EntityType.ELECTRIC_FENCE)
        placeFenceItem.isDisabled = () => placeFenceItem.hasUnfulfilledDependency || !this.canPlaceFence
        placeFenceItem.onClick = () => this.publishEvent(new PlaceFence())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.hasRubble = event.hasRubble
            this.canPlaceFence = event.canPlaceFence
            this.updateAllButtonStates()
        })
    }

    override reset() {
        super.reset()
        this.hasRubble = false
        this.canPlaceFence = false
    }
}
