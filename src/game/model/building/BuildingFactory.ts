import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { BuildingEntity } from './BuildingEntity'
import { Barracks } from './entities/Barracks'
import { Docks } from './entities/Docks'
import { Geodome } from './entities/Geodome'
import { GunStation } from './entities/GunStation'
import { OreRefinery } from './entities/OreRefinery'
import { PowerStation } from './entities/PowerStation'
import { TeleportBig } from './entities/TeleportBig'
import { TeleportPad } from './entities/TeleportPad'
import { Toolstation } from './entities/Toolstation'
import { Upgrade } from './entities/Upgrade'

export class BuildingFactory {

    static createBuildingFromType(entityType: EntityType, sceneMgr: SceneManager, entityMgr: EntityManager): BuildingEntity {
        switch (entityType) {
            case EntityType.TOOLSTATION:
                return new Toolstation(sceneMgr, entityMgr)
            case EntityType.TELEPORT_PAD:
                return new TeleportPad(sceneMgr, entityMgr)
            case EntityType.DOCKS:
                return new Docks(sceneMgr, entityMgr)
            case EntityType.POWER_STATION:
                return new PowerStation(sceneMgr, entityMgr)
            case EntityType.BARRACKS:
                return new Barracks(sceneMgr, entityMgr)
            case EntityType.UPGRADE:
                return new Upgrade(sceneMgr, entityMgr)
            case EntityType.GEODOME:
                return new Geodome(sceneMgr, entityMgr)
            case EntityType.ORE_REFINERY:
                return new OreRefinery(sceneMgr, entityMgr)
            case EntityType.GUNSTATION:
                return new GunStation(sceneMgr, entityMgr)
            case EntityType.TELEPORT_BIG:
                return new TeleportBig(sceneMgr, entityMgr)
            default:
                throw new Error('Unexpected building type: ' + EntityType[entityType])
        }
    }

}
