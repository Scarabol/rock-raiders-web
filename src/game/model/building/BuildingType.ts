import { Vector2 } from 'three'
import { BuildingEntityStats } from '../../../cfg/GameStatsCfg'
import { EntityType } from '../EntityType'
import { GameConfig } from '../../../cfg/GameConfig'

export class BuildingType {
    entityType: EntityType
    stats: BuildingEntityStats
    aeFilename: string
    secondaryBuildingPart: Vector2
    primaryPowerPath: Vector2 = new Vector2(0, 1)
    secondaryPowerPath: Vector2
    waterPathSurface: Vector2
    teleportedEntityTypes: EntityType[] = []

    constructor(entityType: EntityType, stats: BuildingEntityStats, aeFilename: string) {
        this.entityType = entityType
        this.stats = stats
        this.aeFilename = aeFilename
    }

    static from(entityType: EntityType): BuildingType {
        switch (entityType) {
            case EntityType.TOOLSTATION:
                return new BuildingType(entityType, GameConfig.instance.stats.toolStation, 'Buildings/Toolstation')
                    .addTeleport(EntityType.PILOT)
            case EntityType.TELEPORT_PAD:
                return new BuildingType(entityType, GameConfig.instance.stats.teleportPad, 'Buildings/Teleports')
                    .addTeleport(EntityType.PILOT, EntityType.HOVERBOARD, EntityType.SMALL_TRUCK, EntityType.SMALL_DIGGER, EntityType.SMALL_MLP, EntityType.SMALL_HELI) // XXX evaluate stats UseSmallTeleporter
            case EntityType.DOCKS:
                return new BuildingType(entityType, GameConfig.instance.stats.docks, 'Buildings/Docks')
                    .setPrimaryPowerPath(0, -1).setWaterPathSurface(0, 1).addTeleport(EntityType.SMALL_CAT, EntityType.LARGE_CAT) // XXX evaluate stats UseWaterTeleporter
            case EntityType.POWER_STATION:
                return new BuildingType(entityType, GameConfig.instance.stats.powerStation, 'Buildings/Powerstation')
                    .setSecondaryBuildingPart(-1, 0)
            case EntityType.BARRACKS:
                return new BuildingType(entityType, GameConfig.instance.stats.barracks, 'Buildings/Barracks')
            case EntityType.UPGRADE:
                return new BuildingType(entityType, GameConfig.instance.stats.upgrade, 'Buildings/Upgrade')
            case EntityType.GEODOME:
                return new BuildingType(entityType, GameConfig.instance.stats.geoDome, 'Buildings/Geo-dome')
                    .removePrimaryPowerPath().setSecondaryBuildingPart(0, 1)
            case EntityType.ORE_REFINERY:
                return new BuildingType(entityType, GameConfig.instance.stats.oreRefinery, 'Buildings/OreRefinery')
                    .setPrimaryPowerPath(0, 2).setSecondaryBuildingPart(0, 1)
            case EntityType.GUNSTATION:
                return new BuildingType(entityType, GameConfig.instance.stats.gunStation, 'Buildings/gunstation')
                    .removePrimaryPowerPath()
            case EntityType.TELEPORT_BIG:
                return new BuildingType(entityType, GameConfig.instance.stats.teleportBig, 'Buildings/BIGTeleport')
                    .setSecondaryBuildingPart(0, 1).setPrimaryPowerPath(-1, 0).setSecondaryPowerPath(-1, 1)
                    .addTeleport(EntityType.BULLDOZER, EntityType.WALKER_DIGGER, EntityType.LARGE_MLP, EntityType.LARGE_DIGGER) // XXX evaluate stats UseLargeTeleporter
            default:
                if (entityType) console.error(`EntityType (${entityType}) is not a BuildingType`)
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

    removePrimaryPowerPath(): this {
        this.primaryPowerPath = null
        return this
    }

    addTeleport(...teleportedEntityTypes: EntityType[]): this {
        this.teleportedEntityTypes = teleportedEntityTypes
        return this
    }

    getObjectName(level: number): string {
        let objectName = GameConfig.instance.objectNamesCfg.get(this.entityType.toLowerCase())
        const upgradeName = GameConfig.instance.upgradeNames[level - 1]
        if (upgradeName) objectName += ` (${upgradeName})`
        return objectName
    }

    getSfxKey(): string {
        return GameConfig.instance.objTtSFXs.get(this.entityType.toLowerCase())
    }
}
