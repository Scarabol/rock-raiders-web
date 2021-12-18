import { EntityType } from '../EntityType'
import { BuildingEntityStats } from '../../../cfg/GameStatsCfg'
import { Vector2 } from 'three'
import { RaiderActivity } from '../activities/RaiderActivity'
import { ResourceManager } from '../../../resource/ResourceManager'

export class BuildingType {
    entityType: EntityType = null
    stats: BuildingEntityStats = null
    aeFilename: string = null
    secondaryBuildingPart: Vector2 = null
    primaryPowerPath: Vector2 = new Vector2(0, 1)
    secondaryPowerPath: Vector2 = null
    waterPathSurface: Vector2 = null
    dropAction: RaiderActivity = RaiderActivity.Place
    teleportedEntityTypes: EntityType[] = []

    constructor(entityType: EntityType, stats: BuildingEntityStats, aeFilename: string) {
        this.entityType = entityType
        this.stats = stats
        this.aeFilename = aeFilename
    }

    static from(entityType: EntityType): BuildingType {
        switch (entityType) {
            case EntityType.TOOLSTATION:
                return new BuildingType(entityType, ResourceManager.configuration.stats.Toolstation, 'Buildings/Toolstation/Toolstation.ae')
                    .addTeleport(EntityType.PILOT)
            case EntityType.TELEPORT_PAD:
                return new BuildingType(entityType, ResourceManager.configuration.stats.TeleportPad, 'Buildings/Teleports/Teleports.ae')
                    .addTeleport(EntityType.PILOT, EntityType.HOVERBOARD, EntityType.SMALL_TRUCK, EntityType.SMALL_CAT, EntityType.SMALL_DIGGER, EntityType.SMALL_MLP, EntityType.SMALL_HELI) // TODO evaluate stats UseSmallTeleporter
            case EntityType.DOCKS:
                return new BuildingType(entityType, ResourceManager.configuration.stats.Docks, 'Buildings/Docks/Docks.ae')
                    .setPrimaryPowerPath(0, -1).setWaterPathSurface(0, 1)
            case EntityType.POWER_STATION:
                return new BuildingType(entityType, ResourceManager.configuration.stats.Powerstation, 'Buildings/Powerstation/Powerstation.ae')
                    .setSecondaryBuildingPart(-1, 0).setDropAction(RaiderActivity.Deposit)
            case EntityType.BARRACKS:
                return new BuildingType(entityType, ResourceManager.configuration.stats.Barracks, 'Buildings/Barracks/Barracks.ae')
            case EntityType.UPGRADE:
                return new BuildingType(entityType, ResourceManager.configuration.stats.Upgrade, 'Buildings/Upgrade/Upgrade.ae')
            case EntityType.GEODOME:
                return new BuildingType(entityType, ResourceManager.configuration.stats.Geodome, 'Buildings/Geo-dome/Geo-dome.ae')
                    .removePrimaryPowerPath().setSecondaryBuildingPart(0, 1)
            case EntityType.ORE_REFINERY:
                return new BuildingType(entityType, ResourceManager.configuration.stats.OreRefinery, 'Buildings/OreRefinery/OreRefinery.ae')
                    .setPrimaryPowerPath(0, 2).setSecondaryBuildingPart(0, 1).setDropAction(RaiderActivity.Deposit)
            case EntityType.GUNSTATION:
                return new BuildingType(entityType, ResourceManager.configuration.stats.GunStation, 'Buildings/gunstation/gunstation.ae')
                    .removePrimaryPowerPath()
            case EntityType.TELEPORT_BIG:
                return new BuildingType(entityType, ResourceManager.configuration.stats.TeleportBIG, 'Buildings/BIGTeleport/BIGTeleport.ae')
                    .setSecondaryBuildingPart(0, 1).setPrimaryPowerPath(-1, 0).setSecondaryPowerPath(-1, 1)
                    .addTeleport(EntityType.BULLDOZER, EntityType.WALKER_DIGGER, EntityType.LARGE_MLP, EntityType.LARGE_DIGGER, EntityType.LARGE_CAT) // TODO evaluate stats UseLargeTeleporter
            default:
                if (entityType) console.error(`EntityType (${entityType}, ${EntityType[entityType]}) is not a BuildingType`)
                return null
        }
    }

    setPrimaryPowerPath(x: number, y: number): this {
        this.primaryPowerPath.set(x, y)
        return this
    }

    setSecondaryPowerPath(x: number, y: number): this {
        this.secondaryPowerPath = new Vector2(x, y)
        return this
    }

    setWaterPathSurface(x: number, y: number): this {
        this.waterPathSurface = new Vector2(x, y)
        return this
    }

    setSecondaryBuildingPart(x: number, y: number): this {
        this.secondaryBuildingPart = new Vector2(x, y)
        return this
    }

    setDropAction(dropAction: RaiderActivity): this {
        this.dropAction = dropAction
        return this
    }

    removePrimaryPowerPath(): this {
        this.setPrimaryPowerPath = null
        return this
    }

    addTeleport(...teleportedEntityTypes: EntityType[]): this {
        this.teleportedEntityTypes = teleportedEntityTypes
        return this
    }
}
