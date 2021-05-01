import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { EntityDeselected } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { GameState } from '../../game/model/GameState'
import { Surface } from '../../game/model/map/Surface'
import { RaiderTraining } from '../../game/model/raider/RaiderTraining'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectWallPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        const itemDrill = this.addWallMenuItem('Interface_MenuItem_Dig', () => GameState.selectedSurface?.createDrillJob())
        itemDrill.isDisabled = () => !(GameState.selectedSurface?.isDrillable()) &&
            !(GameState.selectedSurface?.isDrillableHard()) // TODO implement vehicle check for drill hard skill
        const itemReinforce = this.addWallMenuItem('Interface_MenuItem_Reinforce', () => GameState.selectedSurface?.createReinforceJob())
        itemReinforce.isDisabled = () => !(GameState.selectedSurface?.isReinforcable())
        const itemDynamite = this.addWallMenuItem('Interface_MenuItem_Dynamite', () => GameState.selectedSurface?.createDynamiteJob())
        itemDynamite.isDisabled = () => !GameState.hasBuildingWithUpgrades(EntityType.TOOLSTATION, 2) &&
            !GameState.raiders.some((r) => r.hasTraining(RaiderTraining.DEMOLITION))
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

    addWallMenuItem(itemKey: string, callback: () => any): IconPanelButton {
        const item = this.addMenuItem('InterfaceImages', itemKey)
        item.onClick = () => {
            callback()
            EventBus.publishEvent(new EntityDeselected())
        }
        return item
    }

}
