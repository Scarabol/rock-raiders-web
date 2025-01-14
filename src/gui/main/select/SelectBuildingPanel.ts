import { EventKey } from '../../../event/EventKeyEnum'
import { BeamUpBuilding, ChangeBuildingPowerState, ChangeTooltip, RepairBuilding, UpgradeBuilding } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { Panel } from '../../base/Panel'
import { IconPanelToggleButton } from '../IconPanelToggleButton'
import { IconSubPanel } from '../IconSubPanel'
import { TOOLTIP_DELAY_SFX } from '../../../params'
import { GameConfig } from '../../../cfg/GameConfig'
import { TooltipSpriteBuilder } from '../../../resource/TooltipSpriteBuilder'

export class SelectBuildingPanel extends IconSubPanel {
    buildingNeedsRepair: boolean = false
    buildingCanSwitchPower: boolean = false
    buildingPowerSwitchState: boolean = false
    buildingCanUpgrade: boolean = false
    buildingMissingOreForUpgrade: number = 0

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel)
        const repairBuildingItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_Repair')
        repairBuildingItem.isDisabled = () => !this.buildingNeedsRepair
        repairBuildingItem.onClick = () => this.publishEvent(new RepairBuilding())
        const menuItemOffCfg = GameConfig.instance.interfaceImages.get('Interface_MenuItem_PowerOff'.toLowerCase())
        const menuItemOnCfg = GameConfig.instance.interfaceImages.get('Interface_MenuItem_PowerOn'.toLowerCase())
        const powerSwitchItem = this.addChild(new IconPanelToggleButton(menuItemOffCfg, menuItemOnCfg, this.img.width, this.iconPanelButtons.length))
        this.iconPanelButtons.push(powerSwitchItem)
        powerSwitchItem.isDisabled = () => !this.buildingCanSwitchPower
        powerSwitchItem.isToggled = () => !this.buildingPowerSwitchState
        powerSwitchItem.onClick = () => this.publishEvent(new ChangeBuildingPowerState(!powerSwitchItem.toggleState))
        const upgradeItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.isDisabled = () => !this.buildingCanUpgrade
        upgradeItem.onClick = () => this.publishEvent(new UpgradeBuilding())
        upgradeItem.showTooltipDisabled = () => {
            const event: ChangeTooltip = new ChangeTooltip(upgradeItem.tooltipDisabled, 0, upgradeItem.tooltipDisabledSfx, TOOLTIP_DELAY_SFX, () => {
                return TooltipSpriteBuilder.getBuildingMissingOreForUpgradeTooltipSprite(event.tooltipText, this.buildingMissingOreForUpgrade)
            })
            this.publishEvent(event)
        }
        const deleteBuildingItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_DeleteBuilding')
        deleteBuildingItem.isDisabled = () => false
        deleteBuildingItem.onClick = () => this.publishEvent(new BeamUpBuilding())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.buildingNeedsRepair = event.buildingNeedsRepair
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
