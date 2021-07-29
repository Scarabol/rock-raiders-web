import { CancelBuildMode, SelectBuildMode } from '../../event/GuiCommand'
import { EntityType, getEntityTypeByName } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { DependencyCheckPanel } from './DependencyCheckPanel'

export class BuildingPanel extends DependencyCheckPanel {
    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 10, onBackPanel)
        this.backBtn.onClick = () => {
            this.publishEvent(new CancelBuildMode())
            this.toggleState(() => onBackPanel.toggleState())
        }
        this.addBuildMenuItem('Toolstation', EntityType.TOOLSTATION)
        this.addBuildMenuItem('TeleportPad', EntityType.TELEPORT_PAD)
        this.addBuildMenuItem('Docks', EntityType.DOCKS)
        this.addBuildMenuItem('Powerstation', EntityType.POWER_STATION)
        this.addBuildMenuItem('Barracks', EntityType.BARRACKS)
        this.addBuildMenuItem('Upgrade', EntityType.UPGRADE)
        this.addBuildMenuItem('Geo-dome', EntityType.GEODOME)
        this.addBuildMenuItem('OreRefinery', EntityType.ORE_REFINERY)
        this.addBuildMenuItem('Gunstation', EntityType.GUNSTATION)
        this.addBuildMenuItem('TeleportBIG', EntityType.TELEPORT_BIG)
    }

    addBuildMenuItem(itemKey: string, entityType: EntityType) {
        const item = this.addDependencyMenuItem(itemKey)
        item.onClick = () => this.publishEvent(new SelectBuildMode(entityType))
    }

    protected checkDependency(dependency: [string, number]): boolean {
        const type = getEntityTypeByName(dependency[0])
        const minLevel = dependency[1]
        if (type === EntityType.PILOT) {
            return this.hasRaider
        } else {
            const buildingsByLevel = this.discoveredBuildingsByTypeAndLevel.get(type)
            let result = false
            buildingsByLevel?.forEach((quantity, level) => {
                if (level >= minLevel) result = result || quantity > 0
            })
            return result
        }
    }
}
