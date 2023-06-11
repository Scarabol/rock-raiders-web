import { EventKey } from '../../../event/EventKeyEnum'
import { BeamUpBuilding, ChangeBuildingPowerState, ChangeTooltip, UpgradeBuilding } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { OffscreenCache } from '../../../worker/OffscreenCache'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { IconPanelToggleButton } from '../IconPanelToggleButton'
import { SelectBasePanel } from './SelectBasePanel'
import { TOOLTIP_DELAY_SFX, TOOLTIP_DELAY_TEXT_MENU } from '../../../params'

export class SelectBuildingPanel extends SelectBasePanel {
    buildingCanSwitchPower: boolean = false
    buildingPowerSwitchState: boolean = false
    buildingCanUpgrade: boolean = false
    buildingMissingOreForUpgrade: number = 0

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 4, onBackPanel)
        this.addMenuItem(OffscreenCache.configuration.interfaceImages, 'Interface_MenuItem_Repair') // TODO implement repair buildings
        const menuItemOffCfg = OffscreenCache.configuration.interfaceImages.get('Interface_MenuItem_PowerOff'.toLowerCase())
        const menuItemOnCfg = OffscreenCache.configuration.interfaceImages.get('Interface_MenuItem_PowerOn'.toLowerCase())
        const powerSwitchItem = this.addChild(new IconPanelToggleButton(this, menuItemOffCfg, menuItemOnCfg, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(powerSwitchItem)
        powerSwitchItem.isDisabled = () => !this.buildingCanSwitchPower
        powerSwitchItem.isToggled = () => !this.buildingPowerSwitchState
        powerSwitchItem.onClick = () => this.publishEvent(new ChangeBuildingPowerState(!powerSwitchItem.toggleState))
        const upgradeItem = this.addMenuItem(OffscreenCache.configuration.interfaceImages, 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.isDisabled = () => !this.buildingCanUpgrade
        upgradeItem.onClick = () => this.publishEvent(new UpgradeBuilding())
        upgradeItem.showTooltipDisabled = () => {
            this.publishEvent(new ChangeTooltip(upgradeItem.tooltipDisabled, TOOLTIP_DELAY_TEXT_MENU, upgradeItem.tooltipDisabledSfx, TOOLTIP_DELAY_SFX, null, null, this.buildingMissingOreForUpgrade))
        }
        const deleteBuildingItem = this.addMenuItem(OffscreenCache.configuration.interfaceImages, 'Interface_MenuItem_DeleteBuilding')
        deleteBuildingItem.isDisabled = () => false
        deleteBuildingItem.onClick = () => this.publishEvent(new BeamUpBuilding())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.buildingCanSwitchPower = event.buildingCanSwitchPower
            this.buildingPowerSwitchState = event.buildingPowerSwitchState
            this.buildingCanUpgrade = event.buildingCanUpgrade
            this.buildingMissingOreForUpgrade = event.buildingMissingOreForUpgrade
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.MATERIAL_AMOUNT_CHANGED, () => {
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.buildingCanSwitchPower = false
        this.buildingPowerSwitchState = false
        this.buildingCanUpgrade = false
        this.buildingMissingOreForUpgrade = 0
    }
}
