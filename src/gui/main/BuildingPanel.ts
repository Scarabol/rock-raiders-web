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
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'

export class BuildingPanel extends IconSubPanel {

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 10, onBackPanel)
        this.backBtn.onClick = () => {
            EventBus.publishEvent(new CancelBuildMode())
            this.toggleState(() => onBackPanel.toggleState())
        }
        this.addBuildMenuItem('InterfaceBuildImages', 'Toolstation', (worldMgr: WorldManager, sceneMgr: SceneManager) => new Toolstation(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportPad', (worldMgr: WorldManager, sceneMgr: SceneManager) => new TeleportPad(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'Docks', (worldMgr: WorldManager, sceneMgr: SceneManager) => new Docks(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'Powerstation', (worldMgr: WorldManager, sceneMgr: SceneManager) => new PowerStation(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'Barracks', (worldMgr: WorldManager, sceneMgr: SceneManager) => new Barracks(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'Upgrade', (worldMgr: WorldManager, sceneMgr: SceneManager) => new Upgrade(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'Geo-dome', (worldMgr: WorldManager, sceneMgr: SceneManager) => new Geodome(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'OreRefinery', (worldMgr: WorldManager, sceneMgr: SceneManager) => new OreRefinery(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'Gunstation', (worldMgr: WorldManager, sceneMgr: SceneManager) => new GunStation(worldMgr, sceneMgr))
        this.addBuildMenuItem('InterfaceBuildImages', 'TeleportBIG', (worldMgr: WorldManager, sceneMgr: SceneManager) => new TeleportBig(worldMgr, sceneMgr))
    }

    addBuildMenuItem(menuItemGroup: string, itemKey: string, factory: (worldMgr: WorldManager, sceneMgr: SceneManager) => BuildingEntity) {
        const item = this.addMenuItem(menuItemGroup, itemKey)
        item.isDisabled = () => false // TODO check Dependencies from config
        item.onClick = () => GameState.buildModeSelection = factory
        return item
    }

}
