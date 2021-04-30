import { EventBus } from '../../event/EventBus'
import { CancelBuildMode } from '../../event/LocalEvents'
import { Building } from '../../game/model/building/Building'
import { GameState } from '../../game/model/GameState'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class BuildingPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(10, onBackPanel)
        this.backBtn.onClick = () => {
            EventBus.publishEvent(new CancelBuildMode())
            this.toggleState(() => onBackPanel.toggleState())
        }
        this.addBuildMenuItem('InterfaceBuildImages', 'Toolstation', Building.TOOLSTATION)
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportPad', Building.TELEPORT_PAD)
        this.addBuildMenuItem('InterfaceBuildImages', 'Docks', Building.DOCKS)
        this.addBuildMenuItem('InterfaceBuildImages', 'Powerstation', Building.POWER_STATION)
        this.addBuildMenuItem('InterfaceBuildImages', 'Barracks', Building.BARRACKS)
        this.addBuildMenuItem('InterfaceBuildImages', 'Upgrade', Building.UPGRADE)
        this.addBuildMenuItem('InterfaceBuildImages', 'Geo-dome', Building.GEODOME)
        this.addBuildMenuItem('InterfaceBuildImages', 'OreRefinery', Building.ORE_REFINERY)
        this.addBuildMenuItem('InterfaceBuildImages', 'Gunstation', Building.GUNSTATION)
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportBIG', Building.TELEPORT_BIG)
    }

    addBuildMenuItem(menuItemGroup: string, itemKey: string, building: Building) {
        const item = this.addMenuItem(menuItemGroup, itemKey)
        item.isDisabled = () => false // TODO check Dependencies from config
        // TODO show dependencies tooltip, when disabled
        item.onClick = () => GameState.buildModeSelection = building
        return item
    }

}
