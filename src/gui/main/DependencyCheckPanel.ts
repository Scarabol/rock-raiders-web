import { EventKey } from '../../event/EventKeyEnum'
import { BuildingsChangedEvent, RaidersAmountChangedEvent } from '../../event/LocalEvents'
import { EntityType, getEntityTypeByName } from '../../game/model/EntityType'
import { DEV_MODE } from '../../params'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export abstract class DependencyCheckPanel extends IconSubPanel {
    hasRaider: boolean = false
    discoveredBuildingsMaxLevel: Map<EntityType, number> = new Map()

    protected constructor(parent: BaseElement, numOfItems: number, onBackPanel: Panel) {
        super(parent, numOfItems, onBackPanel)
        this.registerEventListener(EventKey.RAIDER_AMOUNT_CHANGED, (event: RaidersAmountChangedEvent) => {
            this.hasRaider = event.hasRaider
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.discoveredBuildingsMaxLevel = event.discoveredBuildingsMaxLevel
            this.updateAllButtonStates()
        })
    }

    reset() {
        super.reset()
        this.hasRaider = false
        this.discoveredBuildingsMaxLevel = new Map()
    }

    protected addDependencyMenuItem(itemKey: string) {
        const item = super.addMenuItem('InterfaceBuildImages', itemKey)
        // TODO when update state also update tooltip icons showing missing dependencies
        const dependencies: [string, number][] = OffscreenCache.cfg('Dependencies', `AlwaysCheck:${itemKey}`)
        item.isDisabled = () => !DEV_MODE && dependencies.some((d) => !this.checkDependency(d))
        return item
    }

    protected checkDependency(dependency: [string, number]) {
        const type = getEntityTypeByName(dependency[0])
        const minLevel = dependency[1]
        if (type === EntityType.PILOT) {
            return this.hasRaider
        } else {
            return this.discoveredBuildingsMaxLevel.getOrDefault(type, -1) >= minLevel
        }
    }
}
