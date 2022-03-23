import { MenuItemCfg } from '../../../cfg/ButtonCfg'
import { EventKey } from '../../../event/EventKeyEnum'
import { BeamUpBuilding, ChangeBuildingPowerState, UpgradeBuilding } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { MaterialAmountChanged } from '../../../event/WorldEvents'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { OffscreenCache } from '../../../worker/OffscreenCache'
import { IconPanelToggleButton } from '../IconPanelToggleButton'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectBuildingPanel extends SelectBasePanel {
    buildingCanSwitchPower: boolean = false
    buildingPowerSwitchState: boolean = false
    buildingCanUpgrade: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 4, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair') // TODO implement repair buildings
        const menuItemOffCfg = new MenuItemCfg(OffscreenCache.cfg('InterfaceImages', 'Interface_MenuItem_PowerOff'))
        const menuItemOnCfg = new MenuItemCfg(OffscreenCache.cfg('InterfaceImages', 'Interface_MenuItem_PowerOn'))
        const powerSwitchItem = this.addChild(new IconPanelToggleButton(this, menuItemOffCfg, menuItemOnCfg, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(powerSwitchItem)
        powerSwitchItem.isDisabled = () => !this.buildingCanSwitchPower
        powerSwitchItem.isToggled = () => !this.buildingPowerSwitchState
        powerSwitchItem.onClick = () => this.publishEvent(new ChangeBuildingPowerState(!powerSwitchItem.toggleState))
        const upgradeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.isDisabled = () => !this.buildingCanUpgrade
        upgradeItem.onClick = () => this.publishEvent(new UpgradeBuilding())
        const deleteBuildingItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding')
        deleteBuildingItem.isDisabled = () => false
        deleteBuildingItem.onClick = () => this.publishEvent(new BeamUpBuilding())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.buildingCanSwitchPower = event.buildingCanSwitchPower
            this.buildingPowerSwitchState = event.buildingPowerSwitchState
            this.buildingCanUpgrade = event.buildingCanUpgrade
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, (event: MaterialAmountChanged) => {
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.buildingCanSwitchPower = false
        this.buildingPowerSwitchState = false
        this.buildingCanUpgrade = false
    }
}
