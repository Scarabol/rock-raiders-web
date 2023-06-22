import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../cfg/GameStatsCfg'
import { ResourceManager } from '../../../resource/ResourceManager'
import { RaiderActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'

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
                return new BuildingType(entityType, ResourceManager.configuration.stats.toolStation, 'Buildings/Toolstation')
                    .addTeleport(EntityType.PILOT)
            case EntityType.TELEPORT_PAD:
                return new BuildingType(entityType, ResourceManager.configuration.stats.teleportPad, 'Buildings/Teleports')
                    .addTeleport(EntityType.PILOT, EntityType.HOVERBOARD, EntityType.SMALL_TRUCK, EntityType.SMALL_DIGGER, EntityType.SMALL_MLP, EntityType.SMALL_HELI) // TODO evaluate stats UseSmallTeleporter
            case EntityType.DOCKS:
                return new BuildingType(entityType, ResourceManager.configuration.stats.docks, 'Buildings/Docks')
                    .setPrimaryPowerPath(0, -1).setWaterPathSurface(0, 1).addTeleport(EntityType.SMALL_CAT, EntityType.LARGE_CAT) // TODO evaluate stats UseWaterTeleporter
            case EntityType.POWER_STATION:
                return new BuildingType(entityType, ResourceManager.configuration.stats.powerStation, 'Buildings/Powerstation')
                    .setSecondaryBuildingPart(-1, 0).setDropAction(RaiderActivity.Deposit)
            case EntityType.BARRACKS:
                return new BuildingType(entityType, ResourceManager.configuration.stats.barracks, 'Buildings/Barracks')
            case EntityType.UPGRADE:
                return new BuildingType(entityType, ResourceManager.configuration.stats.upgrade, 'Buildings/Upgrade')
            case EntityType.GEODOME:
                return new BuildingType(entityType, ResourceManager.configuration.stats.geoDome, 'Buildings/Geo-dome')
                    .removePrimaryPowerPath().setSecondaryBuildingPart(0, 1)
            case EntityType.ORE_REFINERY:
                return new BuildingType(entityType, ResourceManager.configuration.stats.oreRefinery, 'Buildings/OreRefinery')
                    .setPrimaryPowerPath(0, 2).setSecondaryBuildingPart(0, 1).setDropAction(RaiderActivity.Deposit)
            case EntityType.GUNSTATION:
                return new BuildingType(entityType, ResourceManager.configuration.stats.gunStation, 'Buildings/gunstation')
                    .removePrimaryPowerPath()
            case EntityType.TELEPORT_BIG:
                return new BuildingType(entityType, ResourceManager.configuration.stats.teleportBig, 'Buildings/BIGTeleport')
                    .setSecondaryBuildingPart(0, 1).setPrimaryPowerPath(-1, 0).setSecondaryPowerPath(-1, 1)
                    .addTeleport(EntityType.BULLDOZER, EntityType.WALKER_DIGGER, EntityType.LARGE_MLP, EntityType.LARGE_DIGGER) // TODO evaluate stats UseLargeTeleporter
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
        this.primaryPowerPath = null
        return this
    }

    addTeleport(...teleportedEntityTypes: EntityType[]): this {
        this.teleportedEntityTypes = teleportedEntityTypes
        return this
    }
}
