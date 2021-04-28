import { MenuItemCfg } from '../../cfg/MenuItemCfg'
import { EventKey } from '../../event/EventKeyEnum'
import { BeamUpBuilding, ChangeBuildingPowerState, UpgradeBuilding } from '../../event/GuiCommand'
import { SelectionChanged } from '../../event/LocalEvents'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { GuiResourceCache } from '../GuiResourceCache'
import { IconPanelToggleButton } from './IconPanelToggleButton'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectBuildingPanel extends SelectBasePanel {

    usedCrystal = 0
    numCrystal = 0
    buildingCanUpgrade: boolean = false
    buildingCanSwitchPower: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 4, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair') // TODO implement repair buildings
        const menuItemOffCfg = new MenuItemCfg(GuiResourceCache.cfg('InterfaceImages', 'Interface_MenuItem_PowerOff'))
        const menuItemOnCfg = new MenuItemCfg(GuiResourceCache.cfg('InterfaceImages', 'Interface_MenuItem_PowerOn'))
        const powerSwitchItem = this.addChild(new IconPanelToggleButton(this, menuItemOffCfg, menuItemOnCfg, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(powerSwitchItem)
        powerSwitchItem.isDisabled = () => this.usedCrystal >= this.numCrystal || !this.buildingCanSwitchPower
        powerSwitchItem.onToggleStateChange = () => this.publishEvent(new ChangeBuildingPowerState(!powerSwitchItem.toggleState))
        const upgradeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.isDisabled = () => !this.buildingCanUpgrade
        upgradeItem.onClick = () => this.publishEvent(new UpgradeBuilding())
        const deleteBuildingItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding')
        deleteBuildingItem.isDisabled = () => false
        deleteBuildingItem.onClick = () => this.publishEvent(new BeamUpBuilding())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.buildingCanUpgrade = event.buildingCanUpgrade
            this.buildingCanSwitchPower = event.buildingCanSwitchPower
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, (event: MaterialAmountChanged) => {
            this.numCrystal = event.numCrystal
            this.usedCrystal = event.usedCrystal
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.usedCrystal = 0
        this.numCrystal = 0
        this.buildingCanUpgrade = false
        this.buildingCanSwitchPower = false
    }

}
