import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { EntityDeselected } from '../../../event/LocalEvents'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { GameState } from '../../model/GameState'
import { ClearRubbleJob } from '../../model/job/surface/ClearRubbleJob'
import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectRubblePanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(2, onBackPanel)
        const clearRubbleItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_ClearRubble')
        clearRubbleItem.onClick = () => {
            EventBus.publishEvent(new JobCreateEvent(new ClearRubbleJob(GameState.selectedSurface)))
            EventBus.publishEvent(new EntityDeselected())
        }
        clearRubbleItem.isDisabled = () => !GameState.selectedSurface?.hasRubble()
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        EventBus.registerEventListener(EventKey.SELECTED_SURFACE, () => clearRubbleItem.updateState())
    }

}
