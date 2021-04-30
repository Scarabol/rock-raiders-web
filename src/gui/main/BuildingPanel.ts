import { EventBus } from '../../event/EventBus'
import { CancelBuildMode } from '../../event/LocalEvents'
import { BuildingEntity } from '../../game/model/building/BuildingEntity'
import { Barracks } from '../../game/model/building/entities/Barracks'
import { Docks } from '../../game/model/building/entities/Docks'
import { Geodome } from '../../game/model/building/entities/Geodome'
import { GunStation } from '../../game/model/building/entities/GunStation'
import { OreRefinery } from '../../game/model/building/entities/OreRefinery'
import { PowerStation } from '../../game/model/building/entities/PowerStation'
import { TeleportBig } from '../../game/model/building/entities/TeleportBig'
import { TeleportPad } from '../../game/model/building/entities/TeleportPad'
import { Toolstation } from '../../game/model/building/entities/Toolstation'
import { Upgrade } from '../../game/model/building/entities/Upgrade'
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
        this.addBuildMenuItem('InterfaceBuildImages', 'Toolstation', () => new Toolstation())
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportPad', () => new TeleportPad())
        this.addBuildMenuItem('InterfaceBuildImages', 'Docks', () => new Docks())
        this.addBuildMenuItem('InterfaceBuildImages', 'Powerstation', () => new PowerStation())
        this.addBuildMenuItem('InterfaceBuildImages', 'Barracks', () => new Barracks())
        this.addBuildMenuItem('InterfaceBuildImages', 'Upgrade', () => new Upgrade())
        this.addBuildMenuItem('InterfaceBuildImages', 'Geo-dome', () => new Geodome())
        this.addBuildMenuItem('InterfaceBuildImages', 'OreRefinery', () => new OreRefinery())
        this.addBuildMenuItem('InterfaceBuildImages', 'Gunstation', () => new GunStation())
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportBIG', () => new TeleportBig())
    }

    addBuildMenuItem(menuItemGroup: string, itemKey: string, factory: () => BuildingEntity) {
        const item = this.addMenuItem(menuItemGroup, itemKey)
        item.isDisabled = () => false // TODO check Dependencies from config
        item.onClick = () => GameState.buildModeSelection = factory()
        return item
    }

}
