import { EventKey } from '../../event/EventKeyEnum'
import { VehicleBeamUp, VehicleDriverGetOut } from '../../event/GuiCommand'
import { SelectionChanged } from '../../event/LocalEvents'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'

export class SelectVehicleManedPanel extends SelectBasePanel {

    vehicleIsManed: boolean = false

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 7, onBackPanel)
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UnLoadVehicle')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_VehiclePickUp')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeVehicle')
        const leaveVehicleItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GetOut')
        leaveVehicleItem.isDisabled = () => !this.vehicleIsManed
        leaveVehicleItem.onClick = () => this.publishEvent(new VehicleDriverGetOut())
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoFirstPerson')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoSecondPerson')
        const deleteVehicleItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteVehicle')
        deleteVehicleItem.isDisabled = () => false
        deleteVehicleItem.onClick = () => this.publishEvent(new VehicleBeamUp())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.vehicleIsManed = event.vehicleIsManed
            leaveVehicleItem.updateState()
        })
    }

}
