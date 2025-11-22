import { IconSubPanel } from './IconSubPanel'
import { VEHICLE_UPGRADE, VehicleUpgrade } from '../../game/model/vehicle/VehicleUpgrade'
import { Panel } from '../base/Panel'
import { EventKey } from '../../event/EventKeyEnum'
import { SelectionChanged } from '../../event/LocalEvents'
import { UpgradeVehicle } from '../../event/GuiCommand'
import { GameConfig } from '../../cfg/GameConfig'
import { InterfaceImage } from '../../cfg/InterfaceImageCfg'

export class UpgradeVehiclePanel extends IconSubPanel {
    canInstallUpgrade: Map<VehicleUpgrade, boolean> = new Map()

    constructor(onBackPanel: Panel) {
        super(4, onBackPanel, false)
        this.addUpgradeItem('upgradeCarry', VEHICLE_UPGRADE.carry)
        this.addUpgradeItem('upgradeScan', VEHICLE_UPGRADE.scan)
        this.addUpgradeItem('upgradeEngine', VEHICLE_UPGRADE.speed)
        this.addUpgradeItem('upgradeDrill', VEHICLE_UPGRADE.drill)
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.canInstallUpgrade = event.canInstallUpgrade
            this.updateAllButtonStates()
        })
    }

    private addUpgradeItem(interfaceImage: InterfaceImage, upgrade: VehicleUpgrade) {
        const upgradeItem = this.addMenuItem(GameConfig.instance.interfaceImages[interfaceImage])
        upgradeItem.isDisabled = () => !this.canInstallUpgrade.get(upgrade)
        upgradeItem.onClick = () => this.publishEvent(new UpgradeVehicle(upgrade))
    }

    override reset() {
        super.reset()
        this.canInstallUpgrade = new Map()
    }
}
