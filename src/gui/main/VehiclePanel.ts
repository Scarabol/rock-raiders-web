import { EventKey } from '../../event/EventKeyEnum'
import { RequestVehicleSpawn } from '../../event/GuiCommand'
import { RequestedVehiclesChanged } from '../../event/WorldEvents'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { DependencyCheckPanel } from './DependencyCheckPanel'
import { IconPanelButtonLabel } from './IconPanelButtonLabel'

abstract class VehiclePanel extends DependencyCheckPanel {
    requestedVehiclesByType: Map<EntityType, number> = new Map()
    btnLabelByType: Map<EntityType, IconPanelButtonLabel> = new Map()

    protected constructor(parent: BaseElement, numOfItems, onBackPanel: Panel) {
        super(parent, numOfItems, onBackPanel)
        this.registerEventListener(EventKey.REQUESTED_VEHICLES_CHANGED, (event: RequestedVehiclesChanged) => {
            this.requestedVehiclesByType.set(event.vehicle, event.numRequested)
            this.btnLabelByType.get(event.vehicle)?.setLabel(event.numRequested)
        })
    }

    addVehicleMenuItem(itemKey: string, entityType: EntityType) {
        const item = this.addDependencyMenuItem(itemKey)
        item.onClick = () => this.publishEvent(new RequestVehicleSpawn(entityType, this.requestedVehiclesByType.getOrDefault(entityType, 0) + 1))
        item.onClickSecondary = () => {
            const numRequested = this.requestedVehiclesByType.getOrDefault(entityType, 0)
            if (numRequested > 0) this.publishEvent(new RequestVehicleSpawn(entityType, numRequested - 1))
        }
        this.btnLabelByType.set(entityType, item.addChild(new IconPanelButtonLabel(item)))
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
