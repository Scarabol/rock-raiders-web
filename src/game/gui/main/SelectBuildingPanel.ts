import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { EventBus } from '../../../event/EventBus'
import { GameState } from '../../model/GameState'
import { EventKey } from '../../../event/EventKeyEnum'

export class SelectBuildingPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PowerOff') // TODO other option is Interface_MenuItem_PowerOn
        const upgradeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.isDisabled = () => !GameState.selectedBuilding?.canUpgrade()
        upgradeItem.onClick = () => GameState.selectedBuilding?.upgrade()
        const deleteBuildingItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding')
        deleteBuildingItem.isDisabled = () => false
        deleteBuildingItem.onClick = () => GameState.selectedBuilding?.beamUp()
        EventBus.registerEventListener(EventKey.SELECTED_BUILDING, () => upgradeItem.updateState())
        EventBus.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, () => upgradeItem.updateState())
    }

}
