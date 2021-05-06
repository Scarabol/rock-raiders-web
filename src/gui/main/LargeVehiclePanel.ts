import { RequestVehicleSpawn } from '../../event/GuiCommand'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class LargeVehiclePanel extends IconSubPanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 5, onBackPanel)
        this.addVehicleMenuItem('BullDozer', EntityType.BULLDOZER)
        this.addVehicleMenuItem('WalkerDigger', EntityType.WALKER_DIGGER)
        this.addVehicleMenuItem('LargeMLP', EntityType.LARGE_MLP)
        this.addVehicleMenuItem('LargeDigger', EntityType.LARGE_DIGGER)
        this.addVehicleMenuItem('LargeCat', EntityType.LARGE_CAT)
    }

    addVehicleMenuItem(itemKey: string, entityType: EntityType) {
        const item = this.addMenuItem('InterfaceBuildImages', itemKey)
        item.isDisabled = () => false // TODO check Dependencies from config
        item.onClick = () => this.publishEvent(new RequestVehicleSpawn(entityType))
        return item
    }

}
