import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../cfg/BuildingEntityStats'
import { ResourceManager } from '../../../resource/ResourceManager'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { BuildingEntity } from './BuildingEntity'
import { BigTeleport, RaiderOnlyTeleport, SmallTeleport, Teleport } from './Teleport'

export class BuildingFactory {
    static createBuildingFromType(entityType: EntityType, sceneMgr: SceneManager, entityMgr: EntityManager): BuildingEntity {
        switch (entityType) {
            case EntityType.TOOLSTATION:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.Toolstation, 'Buildings/Toolstation/Toolstation.ae')
                    .addTeleport(new RaiderOnlyTeleport()).build()
            case EntityType.TELEPORT_PAD:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.TeleportPad, 'Buildings/Teleports/Teleports.ae')
                    .addTeleport(new SmallTeleport()).build()
            case EntityType.DOCKS:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.Docks, 'Buildings/Docks/Docks.ae')
                    .primaryPowerPath(0, -1).waterPathSurface(0, 1).build()
            case EntityType.POWER_STATION:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.Powerstation, 'Buildings/Powerstation/Powerstation.ae')
                    .secondaryBuildingPart(-1, 0).dropAction(RaiderActivity.Deposit).build()
            case EntityType.BARRACKS:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.Barracks, 'Buildings/Barracks/Barracks.ae')
                    .build()
            case EntityType.UPGRADE:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.Upgrade, 'Buildings/Upgrade/Upgrade.ae')
                    .build()
            case EntityType.GEODOME:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.Geodome, 'Buildings/Geo-dome/Geo-dome.ae')
                    .removePrimaryPowerPath().secondaryBuildingPart(0, 1).build()
            case EntityType.ORE_REFINERY:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.OreRefinery, 'Buildings/OreRefinery/OreRefinery.ae')
                    .primaryPowerPath(0, 2).secondaryBuildingPart(0, 1).dropAction(RaiderActivity.Deposit).build()
            case EntityType.GUNSTATION:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.GunStation, 'Buildings/gunstation/gunstation.ae')
                    .removePrimaryPowerPath().build()
            case EntityType.TELEPORT_BIG:
                return new BuildingEntityBuilder(sceneMgr, entityMgr, entityType, ResourceManager.stats.TeleportBIG, 'Buildings/BIGTeleport/BIGTeleport.ae')
                    .secondaryBuildingPart(0, 1).primaryPowerPath(-1, 0).secondaryPowerPath(-1, 1).addTeleport(new BigTeleport()).build()
            default:
                throw new Error(`Unexpected building type: ${EntityType[entityType]}`)
        }
    }
}

class BuildingEntityBuilder {
    building: BuildingEntity

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType, stats: BuildingEntityStats, aeFilename: string) {
        this.building = new BuildingEntity(sceneMgr, entityMgr, entityType, stats, aeFilename)
    }

    primaryPowerPath(x: number, y: number): this {
        this.building.primaryPowerPath.set(x, y)
        return this
    }

    secondaryPowerPath(x: number, y: number): this {
        this.building.secondaryPowerPath = new Vector2(x, y)
        return this
    }

    waterPathSurface(x: number, y: number): this {
        this.building.waterPathSurface = new Vector2(x, y)
        return this
    }

    secondaryBuildingPart(x: number, y: number): this {
        this.building.secondaryBuildingPart = new Vector2(x, y)
        return this
    }

    dropAction(dropAction: RaiderActivity): this {
        this.building.dropAction = dropAction
        return this
    }

    removePrimaryPowerPath(): this {
        this.building.primaryPowerPath = null
        return this
    }

    addTeleport(teleport: Teleport): this {
        this.building.teleport = teleport
        this.building.teleport.building = this.building
        return this
    }

    build(): BuildingEntity {
        return this.building
    }
}
