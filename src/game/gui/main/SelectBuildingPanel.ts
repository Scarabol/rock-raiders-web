import { MenuItemCfg } from '../../../cfg/MenuItemCfg'
import { EventBus } from '../../../event/EventBus'
import { EventKey } from '../../../event/EventKeyEnum'
import { ResourceManager } from '../../../resource/ResourceManager'
import { GameState } from '../../model/GameState'
import { Panel } from '../base/Panel'
import { IconPanelToggleButton } from './IconPanelToggleButton'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectBuildingPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair')

        const menuItemOffCfg = new MenuItemCfg(ResourceManager.cfg('InterfaceImages', 'Interface_MenuItem_PowerOff'))
        const menuItemOnCfg = new MenuItemCfg(ResourceManager.cfg('InterfaceImages', 'Interface_MenuItem_PowerOn'))
        const powerSwitchItem = this.addChild(new IconPanelToggleButton(this, menuItemOffCfg, menuItemOnCfg, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(powerSwitchItem)
        powerSwitchItem.isDisabled = () => GameState.usedCrystals >= GameState.numCrystal || GameState.selectedBuilding?.stats?.SelfPowered || GameState.selectedBuilding?.stats?.PowerBuilding
        powerSwitchItem.onToggleStateChange = () => {
            if (powerSwitchItem.toggleState) {
                GameState.selectedBuilding?.turnOffPower()
            } else {
                GameState.selectedBuilding?.turnOnPower()
            }
        }
        const upgradeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.isDisabled = () => !GameState.selectedBuilding?.canUpgrade()
        upgradeItem.onClick = () => GameState.selectedBuilding?.upgrade()
        const deleteBuildingItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding')
        deleteBuildingItem.isDisabled = () => false
        deleteBuildingItem.onClick = () => GameState.selectedBuilding?.beamUp()
        EventBus.registerEventListener(EventKey.SELECTED_BUILDING, () => {
            powerSwitchItem.updateState()
            upgradeItem.updateState()
        })
        EventBus.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
            powerSwitchItem.updateState()
            upgradeItem.updateState()
        })
    }

}
