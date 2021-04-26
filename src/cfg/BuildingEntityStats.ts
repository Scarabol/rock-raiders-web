import { Building } from '../game/model/entity/building/Building'
import { ResourceManager } from '../resource/ResourceManager'
import { BaseConfig } from './BaseConfig'

export class BuildingEntityStats extends BaseConfig {

    Levels: number = 0
    SelfPowered: boolean = false
    PowerBuilding: boolean = false
    PickSphere: number = 0
    TrainDynamite: boolean[] = null
    CostOre: number = 0
    CostCrystal: number = 0
    OxygenCoef: number = 0

    static getByType(type: Building): BuildingEntityStats {
        switch (type) {
            case Building.TOOLSTATION:
                return ResourceManager.stats.Toolstation
            case Building.TELEPORT_PAD:
                return ResourceManager.stats.TeleportPad
            case Building.DOCKS:
                return ResourceManager.stats.Docks
            case Building.POWER_STATION:
                return ResourceManager.stats.Powerstation
            case Building.BARRACKS:
                return ResourceManager.stats.Barracks
            case Building.UPGRADE:
                return ResourceManager.stats.Upgrade
            case Building.GEODOME:
                return ResourceManager.stats.Geodome
            case Building.ORE_REFINERY:
                return ResourceManager.stats.OreRefinery
            case Building.GUNSTATION:
                return ResourceManager.stats.GunStation
            case Building.TELEPORT_BIG:
                return ResourceManager.stats.TeleportBIG
        }
        throw 'Unexpected building type: '+type
    }

}
