import { EventKey } from '../../event/EventKeyEnum'
import { RequestVehicleSpawn } from '../../event/GuiCommand'
import { BuildingsChangedEvent, RaidersChangedEvent } from '../../event/LocalEvents'
import { EntityType, getEntityTypeByName } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { GuiResourceCache } from '../GuiResourceCache'
import { IconSubPanel } from './IconSubPanel'

abstract class VehiclePanel extends IconSubPanel {

    hasRaider: boolean = false
    usableBuildingsByTypeAndLevel: Map<EntityType, Map<number, number>> = new Map()

    protected constructor(parent: BaseElement, numOfItems, onBackPanel: Panel) {
        super(parent, numOfItems, onBackPanel)
        // TODO refactor get a list of all entities with quantity and their level from EntityManager
        this.registerEventListener(EventKey.RAIDERS_CHANGED, (event: RaidersChangedEvent) => {
            this.hasRaider = event.numRaiders > 0
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.usableBuildingsByTypeAndLevel = event.usableBuildingsByTypeAndLevel
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.hasRaider = false
        this.usableBuildingsByTypeAndLevel = new Map()
    }

    protected addVehicleMenuItem(itemKey: string, entityType: EntityType) {
        const item = this.addMenuItem('InterfaceBuildImages', itemKey)
        // TODO when update state also update tooltip icons showing missing dependencies
        const dependencies: [string, number][] = GuiResourceCache.cfg('Dependencies', 'AlwaysCheck:' + itemKey)
        item.isDisabled = () => dependencies.some((d) => !this.checkDependency(d))
        item.onClick = () => this.publishEvent(new RequestVehicleSpawn(entityType))
        return item
    }

    private checkDependency(dependency: [string, number]) {
        const type = getEntityTypeByName(dependency[0])
        const minLevel = dependency[1]
        if (type === EntityType.PILOT) {
            return this.hasRaider
        } else {
            const buildingsByLevel = this.usableBuildingsByTypeAndLevel.get(type)
            let result = false
            buildingsByLevel?.forEach((quantity, level) => {
                if (level >= minLevel) result = result || quantity > 0
            })
            return result
        }
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
