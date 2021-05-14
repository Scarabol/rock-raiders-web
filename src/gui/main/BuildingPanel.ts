import { CancelBuildMode, SelectBuildMode } from '../../event/GuiCommand'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class BuildingPanel extends IconSubPanel {

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
        const item = this.addMenuItem('InterfaceBuildImages', itemKey)
        item.isDisabled = () => false // TODO check Dependencies from config
        item.onClick = () => this.publishEvent(new SelectBuildMode(entityType))
        return item
    }

}
