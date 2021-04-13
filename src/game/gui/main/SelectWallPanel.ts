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
import { RaiderSkills } from '../../../scene/model/Raider'

export class SelectWallPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        const itemDrill = this.addWallMenuItem('Interface_MenuItem_Dig', SurfaceJobType.DRILL)
        const itemReinforce = this.addWallMenuItem('Interface_MenuItem_Reinforce', SurfaceJobType.REINFORCE)
        const itemDynamite = this.addWallMenuItem('Interface_MenuItem_Dynamite', SurfaceJobType.BLOW)
        itemDynamite.isDisabled = () => {
            return !GameState.hasBuildingWithUpgrades(Building.TOOLSTATION, 2) &&
                !GameState.raiders.some((r) => r.hasSkills([RaiderSkills.DEMOLITION]))
            // TODO and NOT has vehicle that can drill hard stone
        }
        const itemDeselect = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig')
        itemDeselect.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            selectedSurface.cancelJobs()
            EventBus.publishEvent(new EntityDeselected())
        }
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, (event: SurfaceSelectedEvent) => {
            const surface = event.surface
            if (!surface.surfaceType.floor) {
                itemDrill.disabled = !surface.isDrillable()
                itemReinforce.disabled = !surface.isReinforcable()
                itemDynamite.disabled = !surface.isExplodable()
                this.notifyRedraw()
            }
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
