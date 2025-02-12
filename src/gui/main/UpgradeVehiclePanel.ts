import { IconSubPanel } from './IconSubPanel'
import { VehicleUpgrade } from '../../game/model/vehicle/VehicleUpgrade'
import { Panel } from '../base/Panel'
import { EventKey } from '../../event/EventKeyEnum'
import { SelectionChanged } from '../../event/LocalEvents'
import { UpgradeVehicle } from '../../event/GuiCommand'
import { GameConfig } from '../../cfg/GameConfig'

export class UpgradeVehiclePanel extends IconSubPanel {
    canInstallUpgrade: Map<VehicleUpgrade, boolean> = new Map()

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel, false)
        this.addUpgradeItem('Interface_MenuItem_UpgardeCarry', VehicleUpgrade.CARRY)
        this.addUpgradeItem('Interface_MenuItem_UpgardeScan', VehicleUpgrade.SCAN)
        this.addUpgradeItem('Interface_MenuItem_UpgradeEngine', VehicleUpgrade.SPEED)
        this.addUpgradeItem('Interface_MenuItem_UpgardeDrill', VehicleUpgrade.DRILL)
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.canInstallUpgrade = event.canInstallUpgrade
            this.updateAllButtonStates()
        })
    }

    private addUpgradeItem(itemKey: string, upgrade: VehicleUpgrade) {
        const upgradeItem = this.addMenuItem(GameConfig.instance.interfaceImages, itemKey)
        upgradeItem.isDisabled = () => !this.canInstallUpgrade.get(upgrade)
        upgradeItem.onClick = () => this.publishEvent(new UpgradeVehicle(upgrade))
    }

    reset() {
        super.reset()
        this.canInstallUpgrade = new Map()
    }
}
