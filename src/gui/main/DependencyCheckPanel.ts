import { EventKey } from '../../event/EventKeyEnum'
import { BuildingsChangedEvent, RaidersChangedEvent } from '../../event/LocalEvents'
import { EntityType, getEntityTypeByName } from '../../game/model/EntityType'
import { DEV_MODE } from '../../params'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { GuiResourceCache } from '../GuiResourceCache'
import { IconSubPanel } from './IconSubPanel'

export abstract class DependencyCheckPanel extends IconSubPanel {
    hasRaider: boolean = false
    discoveredBuildingsByTypeAndLevel: Map<EntityType, Map<number, number>> = new Map()
    usableBuildingsByTypeAndLevel: Map<EntityType, Map<number, number>> = new Map()

    protected constructor(parent: BaseElement, numOfItems, onBackPanel: Panel) {
        super(parent, numOfItems, onBackPanel)
        this.registerEventListener(EventKey.RAIDERS_CHANGED, (event: RaidersChangedEvent) => {
            this.hasRaider = event.numRaiders > 0
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.discoveredBuildingsByTypeAndLevel = event.discoveredBuildingsByTypeAndLevel
            this.usableBuildingsByTypeAndLevel = event.usableBuildingsByTypeAndLevel
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.hasRaider = false
        this.discoveredBuildingsByTypeAndLevel = new Map()
        this.usableBuildingsByTypeAndLevel = new Map()
    }

    protected addDependencyMenuItem(itemKey: string) {
        const item = super.addMenuItem('InterfaceBuildImages', itemKey)
        // TODO when update state also update tooltip icons showing missing dependencies
        const dependencies: [string, number][] = GuiResourceCache.cfg('Dependencies', `AlwaysCheck:${itemKey}`)
        item.isDisabled = () => !DEV_MODE && dependencies.some((d) => !this.checkDependency(d))
        return item
    }

    protected checkDependency(dependency: [string, number]) {
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
