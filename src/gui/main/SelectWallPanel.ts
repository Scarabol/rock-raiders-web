import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { EntityDeselected } from '../../event/LocalEvents'
import { JobCreateEvent } from '../../event/WorldEvents'
import { Dynamite } from '../../game/model/collect/Dynamite'
import { EntityType } from '../../game/model/EntityType'
import { GameState } from '../../game/model/GameState'
import { DrillJob } from '../../game/model/job/surface/DrillJob'
import { DynamiteJob } from '../../game/model/job/surface/DynamiteJob'
import { ReinforceJob } from '../../game/model/job/surface/ReinforceJob'
import { SurfaceJob } from '../../game/model/job/surface/SurfaceJob'
import { Surface } from '../../game/model/map/Surface'
import { RaiderSkill } from '../../game/model/raider/RaiderSkill'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectWallPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        const itemDrill = this.addWallMenuItem('Interface_MenuItem_Dig', (s) => new DrillJob(s))
        itemDrill.isDisabled = () => !(GameState.selectedSurface?.isDrillable()) &&
            !(GameState.selectedSurface?.isDrillableHard()) // TODO implement vehicle check for drill hard skill
        const itemReinforce = this.addWallMenuItem('Interface_MenuItem_Reinforce', (s) => new ReinforceJob(s))
        itemReinforce.isDisabled = () => !(GameState.selectedSurface?.isReinforcable())
        const itemDynamite = this.addWallMenuItem('Interface_MenuItem_Dynamite', (s) => SelectWallPanel.createDynamiteJob(s))
        itemDynamite.isDisabled = () => !GameState.hasBuildingWithUpgrades(EntityType.TOOLSTATION, 2) &&
            !GameState.raiders.some((r) => r.hasSkill(RaiderSkill.DEMOLITION))
        const itemDeselect = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig')
        itemDeselect.isDisabled = () => false
        itemDeselect.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            selectedSurface.cancelJobs()
            EventBus.publishEvent(new EntityDeselected())
        }
        EventBus.registerEventListener(EventKey.SELECTED_SURFACE, () => {
            itemDrill.updateState(false)
            itemReinforce.updateState(false)
            itemDynamite.updateState(false)
            this.notifyRedraw()
        })
    }

    addWallMenuItem(itemKey: string, createJob: (surface: Surface) => SurfaceJob): IconPanelButton {
        const item = this.addMenuItem('InterfaceImages', itemKey)
        item.onClick = () => {
            const selectedSurface = GameState.selectedSurface
            if (selectedSurface) {
                EventBus.publishEvent(new JobCreateEvent(createJob(selectedSurface)))
                EventBus.publishEvent(new EntityDeselected())
            }
        }
        return item
    }

    private static createDynamiteJob(surface: Surface) {
        const targetBuilding = GameState.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)
        if (!targetBuilding) throw 'Could not find toolstation to spawn dynamite'
        const dynamite = new Dynamite()
        dynamite.targetSurface = surface
        dynamite.worldMgr = surface.terrain.worldMgr
        dynamite.group.position.copy(targetBuilding.getDropPosition())
        dynamite.worldMgr.sceneManager.scene.add(dynamite.group)
        return new DynamiteJob(surface, dynamite)
    }

}
