import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { GameState } from '../../model/GameState'
import { Surface } from '../../../scene/model/map/Surface'
import { SurfaceJob, SurfaceJobType } from '../../model/job/SurfaceJob'
import { EventBus } from '../../../event/EventBus'
import { JobCreateEvent, SpawnDynamiteEvent } from '../../../event/WorldEvents'
import { EntityDeselected, SurfaceSelectedEvent } from '../../../event/LocalEvents'
import { IconPanelButton } from './IconPanelButton'
import { Building } from '../../model/entity/building/Building'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'

export class SelectWallPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        const itemDrill = this.addWallMenuItem('Interface_MenuItem_Dig', SurfaceJobType.DRILL)
        itemDrill.isDisabled = () => !(GameState.selectedSurface?.isDrillable()) &&
            !(GameState.selectedSurface?.isDrillableHard()) // TODO implement vehicle check for drill hard skill
        const itemReinforce = this.addWallMenuItem('Interface_MenuItem_Reinforce', SurfaceJobType.REINFORCE)
        itemReinforce.isDisabled = () => !(GameState.selectedSurface?.isReinforcable())
        const itemDynamite = this.addWallMenuItem('Interface_MenuItem_Dynamite', SurfaceJobType.BLOW)
        itemDynamite.isDisabled = () => !GameState.hasBuildingWithUpgrades(Building.TOOLSTATION, 2) &&
            !GameState.raiders.some((r) => r.hasSkill(RaiderSkill.DEMOLITION))
        const itemDeselect = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig')
        itemDeselect.isDisabled = () => false
        itemDeselect.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            selectedSurface.cancelJobs()
            EventBus.publishEvent(new EntityDeselected())
        }
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, () => {
            itemDrill.updateState(false)
            itemReinforce.updateState(false)
            itemDynamite.updateState(false)
            this.notifyRedraw()
        })
    }

    addWallMenuItem(itemKey: string, jobType: SurfaceJobType): IconPanelButton {
        const item = this.addMenuItem('InterfaceImages', itemKey)
        item.onClick = () => {
            const selectedSurface = GameState.selectedSurface
            if (selectedSurface) {
                if (jobType === SurfaceJobType.BLOW) {
                    EventBus.publishEvent(new SpawnDynamiteEvent(selectedSurface))
                } else if (!selectedSurface.hasJobType(jobType)) {
                    EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(jobType, selectedSurface)))
                }
                EventBus.publishEvent(new EntityDeselected())
            }
        }
        return item
    }

}
