import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { EventBus } from '../../../event/EventBus'
import { CollectEvent, SpawnMaterialEvent } from '../../../event/WorldEvents'
import { GameState } from '../../model/GameState'
import { BuildingSelected } from '../../../event/LocalEvents'

export class SelectBuildingPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PowerOff') // TODO other option is Interface_MenuItem_PowerOn
        const upgradeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.isDisabled = () => GameState.numOre < 5 || GameState.selectedBuilding?.hasMaxLevel()
        upgradeItem.updateState()
        upgradeItem.onClick = () => GameState.selectedBuilding?.upgrade()
        const deleteBuildingItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding')
        deleteBuildingItem.isDisabled = () => false
        deleteBuildingItem.onClick = () => GameState.selectedBuilding?.beamUp()
        EventBus.registerEventListener(BuildingSelected.eventKey, () => upgradeItem.updateState())
        EventBus.registerEventListener(CollectEvent.eventKey, () => upgradeItem.updateState())
        EventBus.registerEventListener(SpawnMaterialEvent.eventKey, () => upgradeItem.updateState())
    }

}
