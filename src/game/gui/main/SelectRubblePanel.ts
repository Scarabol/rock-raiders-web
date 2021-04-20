import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { GameState } from '../../model/GameState'
import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent } from '../../../event/WorldEvents'
import { SurfaceJob, SurfaceJobType } from '../../model/job/SurfaceJob'
import { EntityDeselected } from '../../../event/LocalEvents'
import { EventKey } from '../../../event/EventKeyEnum'

export class SelectRubblePanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(2, onBackPanel)
        const clearRubbleItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_ClearRubble')
        clearRubbleItem.onClick = () => {
            EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.CLEAR_RUBBLE, GameState.selectedSurface)))
            EventBus.publishEvent(new EntityDeselected())
        }
        clearRubbleItem.isDisabled = () => !GameState.selectedSurface?.hasRubble()
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        EventBus.registerEventListener(EventKey.SELECTED_SURFACE, () => clearRubbleItem.updateState())
    }

}
