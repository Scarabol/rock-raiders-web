import { RequestVehicleSpawn } from '../../event/GuiCommand'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { DependencyCheckPanel } from './DependencyCheckPanel'

abstract class VehiclePanel extends DependencyCheckPanel {

    addVehicleMenuItem(itemKey: string, entityType: EntityType) {
        const item = this.addDependencyMenuItem(itemKey)
        item.onClick = () => this.publishEvent(new RequestVehicleSpawn(entityType))
    }

}

export class SmallVehiclePanel extends VehiclePanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 6, onBackPanel)
        this.addVehicleMenuItem('Hoverboard', EntityType.HOVERBOARD)
        this.addVehicleMenuItem('SmallDigger', EntityType.SMALL_DIGGER)
        this.addVehicleMenuItem('SmallTruck', EntityType.SMALL_TRUCK)
        this.addVehicleMenuItem('SmallCat', EntityType.SMALL_CAT)
        this.addVehicleMenuItem('SmallMLP', EntityType.SMALL_MLP)
        this.addVehicleMenuItem('SmallHeli', EntityType.SMALL_HELI)
    }

}

export class LargeVehiclePanel extends VehiclePanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 5, onBackPanel)
        this.addVehicleMenuItem('BullDozer', EntityType.BULLDOZER)
        this.addVehicleMenuItem('WalkerDigger', EntityType.WALKER_DIGGER)
        this.addVehicleMenuItem('LargeMLP', EntityType.LARGE_MLP)
        this.addVehicleMenuItem('LargeDigger', EntityType.LARGE_DIGGER)
        this.addVehicleMenuItem('LargeCat', EntityType.LARGE_CAT)
    }

}
