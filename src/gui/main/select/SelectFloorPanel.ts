import { EventKey } from '../../../event/EventKeyEnum'
import { CreatePowerPath, MakeRubble, PlaceFence } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectFloorPanel extends SelectBasePanel {
    isGround: boolean = false
    isPowerPath: boolean = false
    canPlaceFence: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 3, onBackPanel)
        const pathItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_LayPath')
        pathItem.onClick = () => this.publishEvent(new CreatePowerPath())
        pathItem.isDisabled = () => !this.isGround
        const removeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_RemovePath')
        removeItem.onClick = () => this.publishEvent(new MakeRubble())
        removeItem.isDisabled = () => !this.isPowerPath
        const placeFenceItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        placeFenceItem.isDisabled = () => !this.canPlaceFence
        placeFenceItem.onClick = () => this.publishEvent(new PlaceFence())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.isGround = event.isGround
            this.isPowerPath = event.isPowerPath
            this.canPlaceFence = event.canPlaceFence
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.isGround = false
        this.isPowerPath = false
        this.canPlaceFence = false
    }
}
