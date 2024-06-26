import { EventKey } from '../../../event/EventKeyEnum'
import { VehicleBeamUp, VehicleCallMan } from '../../../event/GuiCommand'
import { SelectionChanged } from '../../../event/LocalEvents'
import { Panel } from '../../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { GameConfig } from '../../../cfg/GameConfig'

export class SelectVehicleEmptyPanel extends SelectBasePanel {
    vehicleHasJob: boolean = false

    constructor(onBackPanel: Panel) {
        super(2, onBackPanel)
        const manVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_GetIn')
        manVehicleItem.onClick = () => this.publishEvent(new VehicleCallMan())
        manVehicleItem.isDisabled = () => this.vehicleHasJob
        const deleteVehicleItem = this.addMenuItem(GameConfig.instance.interfaceImages, 'Interface_MenuItem_DeleteVehicle')
        deleteVehicleItem.isDisabled = () => false
        deleteVehicleItem.onClick = () => this.publishEvent(new VehicleBeamUp())
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.vehicleHasJob = event.vehicleHasCallManJob
            manVehicleItem.updateState()
        })
    }
}
