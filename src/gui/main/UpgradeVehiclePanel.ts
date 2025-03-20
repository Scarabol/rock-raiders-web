import { IconSubPanel } from './IconSubPanel'
import { VehicleUpgrade } from '../../game/model/vehicle/VehicleUpgrade'
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
        this.addUpgradeItem('upgradeCarry', VehicleUpgrade.CARRY)
        this.addUpgradeItem('upgradeScan', VehicleUpgrade.SCAN)
        this.addUpgradeItem('upgradeEngine', VehicleUpgrade.SPEED)
        this.addUpgradeItem('upgradeDrill', VehicleUpgrade.DRILL)
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

    reset() {
        super.reset()
        this.canInstallUpgrade = new Map()
    }
}
