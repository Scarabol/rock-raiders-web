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
        this.addBuildMenuItem('InterfaceBuildImages', 'Toolstation', EntityType.TOOLSTATION)
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportPad', EntityType.TELEPORT_PAD)
        this.addBuildMenuItem('InterfaceBuildImages', 'Docks', EntityType.DOCKS)
        this.addBuildMenuItem('InterfaceBuildImages', 'Powerstation', EntityType.POWER_STATION)
        this.addBuildMenuItem('InterfaceBuildImages', 'Barracks', EntityType.BARRACKS)
        this.addBuildMenuItem('InterfaceBuildImages', 'Upgrade', EntityType.UPGRADE)
        this.addBuildMenuItem('InterfaceBuildImages', 'Geo-dome', EntityType.GEODOME)
        this.addBuildMenuItem('InterfaceBuildImages', 'OreRefinery', EntityType.ORE_REFINERY)
        this.addBuildMenuItem('InterfaceBuildImages', 'Gunstation', EntityType.GUNSTATION)
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportBIG', EntityType.TELEPORT_BIG)
    }

    addBuildMenuItem(menuItemGroup: string, itemKey: string, entityType: EntityType) {
        const item = this.addMenuItem(menuItemGroup, itemKey)
        item.isDisabled = () => false // TODO check Dependencies from config
        item.onClick = () => this.publishEvent(new SelectBuildMode(entityType))
        return item
    }

}
