import { EventKey } from '../../../event/EventKeyEnum'
import { VehicleBeamUp, VehicleDriverGetOut, VehicleUnload } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { BaseElement } from '../../base/BaseElement'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { IconPanelButton } from '../IconPanelButton'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectVehicleManedPanel extends SelectBasePanel {
    readonly upgradeItem: IconPanelButton
    noVehicleWithDriver: boolean = false
    noVehicleWithCarriedItems: boolean = false
    hasUpgradeSite: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 7, onBackPanel)
        const unloadVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_UnLoadVehicle')
        unloadVehicleItem.isDisabled = () => this.noVehicleWithCarriedItems
        unloadVehicleItem.onClick = () => this.publishEvent(new VehicleUnload())
        this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_VehiclePickUp')
        this.upgradeItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_UpgradeVehicle')
        this.upgradeItem.isDisabled = () => !this.hasUpgradeSite
        const leaveVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GetOut')
        leaveVehicleItem.isDisabled = () => this.noVehicleWithDriver
        leaveVehicleItem.onClick = () => this.publishEvent(new VehicleDriverGetOut())
        this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GotoFirstPerson')
        this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GotoSecondPerson')
        const deleteVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_DeleteVehicle')
        deleteVehicleItem.isDisabled = () => false
        deleteVehicleItem.onClick = () => this.publishEvent(new VehicleBeamUp())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.noVehicleWithDriver = event.noVehicleWithDriver
            this.noVehicleWithCarriedItems = !event.vehicleWithCarriedItems
            leaveVehicleItem.updateState()
            this.hasUpgradeSite = event.hasUpgradeSite
        })
    }

    reset() {
        super.reset()
        this.noVehicleWithCarriedItems = false
        this.noVehicleWithCarriedItems = false
        this.hasUpgradeSite = false
    }
}
