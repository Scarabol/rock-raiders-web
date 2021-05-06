import { RequestVehicleSpawn } from '../../event/GuiCommand'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class SmallVehiclePanel extends IconSubPanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 6, onBackPanel)
        this.addVehicleMenuItem('Hoverboard', EntityType.HOVERBOARD)
        this.addVehicleMenuItem('SmallDigger', EntityType.SMALL_DIGGER)
        this.addVehicleMenuItem('SmallTruck', EntityType.SMALL_TRUCK)
        this.addVehicleMenuItem('SmallCat', EntityType.SMALL_CAT)
        this.addVehicleMenuItem('SmallMLP', EntityType.SMALL_MLP)
        this.addVehicleMenuItem('SmallHeli', EntityType.SMALL_HELI)
    }

    addVehicleMenuItem(itemKey: string, entityType: EntityType) {
        const item = this.addMenuItem('InterfaceBuildImages', itemKey)
        item.isDisabled = () => false // TODO check Dependencies from config
        item.onClick = () => this.publishEvent(new RequestVehicleSpawn(entityType))
        return item
    }

}
