import { EventKey } from '../../event/EventKeyEnum'
import { EntityDeselected } from '../../event/LocalEvents'
import { GameState } from '../../game/model/GameState'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectRubblePanel extends SelectBasePanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 2, onBackPanel)
        const clearRubbleItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_ClearRubble')
        clearRubbleItem.onClick = () => {
            GameState.selectedSurface?.createClearRubbleJob()
            this.publishEvent(new EntityDeselected())
        }
        clearRubbleItem.isDisabled = () => !GameState.selectedSurface?.hasRubble()
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        this.registerEventListener(EventKey.SELECTED_SURFACE, () => clearRubbleItem.updateState())
    }

}
