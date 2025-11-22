import { EventKey } from '../../../event/EventKeyEnum'
import { CAMERA_VIEW_MODE, ChangeCameraEvent, VehicleBeamUp, VehicleDriverGetOut, VehicleLoad, VehicleUnload } from '../../../event/GuiCommand'
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
        super(7, onBackPanel, true)
        const unloadVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages.unLoadVehicle)
        unloadVehicleItem.isDisabled = () => this.noVehicleWithCarried
        unloadVehicleItem.onClick = () => this.publishEvent(new VehicleUnload())
        const loadVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages.vehiclePickUp)
        loadVehicleItem.isDisabled = () => !this.someVehicleCanLoad
        loadVehicleItem.onClick = () => this.publishEvent(new VehicleLoad())
        this.upgradeItem = this.addMenuItem(GameConfig.instance.interfaceImages.upgradeVehicle)
        this.upgradeItem.isDisabled = () => !this.hasUpgradeSite
        const leaveVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages.getOut)
        leaveVehicleItem.isDisabled = () => this.noVehicleWithDriver
        leaveVehicleItem.onClick = () => this.publishEvent(new VehicleDriverGetOut())
        const firstPersonView = this.addMenuItem(GameConfig.instance.interfaceImages.gotoFirstPerson)
        firstPersonView.isDisabled = () => false
        firstPersonView.onClick = () => this.publishEvent(new ChangeCameraEvent(CAMERA_VIEW_MODE.fpv))
        const shoulderView = this.addMenuItem(GameConfig.instance.interfaceImages.gotoSecondPerson)
        shoulderView.isDisabled = () => false
        shoulderView.onClick = () => this.publishEvent(new ChangeCameraEvent(CAMERA_VIEW_MODE.shoulder))
        const deleteVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages.deleteVehicle)
        deleteVehicleItem.isDisabled = () => false
        deleteVehicleItem.onClick = () => this.publishEvent(new VehicleBeamUp())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.noVehicleWithCarried = !event.vehicleWithCarried
            this.someVehicleCanLoad = event.someVehicleCanLoad
            this.hasUpgradeSite = event.hasUpgradeSite
            this.noVehicleWithDriver = event.noVehicleWithDriver
            unloadVehicleItem.updateState()
            loadVehicleItem.updateState()
            this.upgradeItem.updateState()
            leaveVehicleItem.updateState()
        })
    }

    override reset() {
        super.reset()
        this.noVehicleWithCarried = false
        this.someVehicleCanLoad = false
        this.hasUpgradeSite = false
        this.noVehicleWithDriver = false
    }
}
