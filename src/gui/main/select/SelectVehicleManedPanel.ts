import { EventKey } from '../../../event/EventKeyEnum'
import { CameraViewMode, ChangeCameraEvent, VehicleBeamUp, VehicleDriverGetOut, VehicleLoad, VehicleUnload } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { Panel } from '../../base/Panel'
import { IconSubPanel } from '../IconSubPanel'
import { IconPanelButton } from '../IconPanelButton'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectVehicleManedPanel extends IconSubPanel {
    readonly upgradeItem: IconPanelButton
    noVehicleWithCarried: boolean = false
    someVehicleCanLoad: boolean = false
    hasUpgradeSite: boolean = false
    noVehicleWithDriver: boolean = false

    constructor(onBackPanel: Panel) {
        super(7, onBackPanel)
        const unloadVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_UnLoadVehicle')
        unloadVehicleItem.isDisabled = () => this.noVehicleWithCarried
        unloadVehicleItem.onClick = () => this.publishEvent(new VehicleUnload())
        const loadVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_VehiclePickUp')
        loadVehicleItem.isDisabled = () => !this.someVehicleCanLoad
        loadVehicleItem.onClick = () => this.publishEvent(new VehicleLoad())
        this.upgradeItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_UpgradeVehicle')
        this.upgradeItem.isDisabled = () => !this.hasUpgradeSite
        const leaveVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GetOut')
        leaveVehicleItem.isDisabled = () => this.noVehicleWithDriver
        leaveVehicleItem.onClick = () => this.publishEvent(new VehicleDriverGetOut())
        const firstPersonView = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GotoFirstPerson')
        firstPersonView.isDisabled = () => false
        firstPersonView.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.FPV))
        const shoulderView = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GotoSecondPerson')
        shoulderView.isDisabled = () => false
        shoulderView.onClick = () => this.publishEvent(new ChangeCameraEvent(CameraViewMode.SHOULDER))
        const deleteVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_DeleteVehicle')
        deleteVehicleItem.isDisabled = () => false
        deleteVehicleItem.onClick = () => this.publishEvent(new VehicleBeamUp())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.noVehicleWithCarried = !event.vehicleWithCarried
            this.someVehicleCanLoad = event.someVehicleCanLoad
            this.hasUpgradeSite = event.hasUpgradeSite
            this.noVehicleWithDriver = event.noVehicleWithDriver
            unloadVehicleItem.updateState()
            loadVehicleItem.updateState()
            leaveVehicleItem.updateState()
        })
    }

    reset() {
        super.reset()
        this.noVehicleWithCarried = false
        this.someVehicleCanLoad = false
        this.hasUpgradeSite = false
        this.noVehicleWithDriver = false
    }
}
