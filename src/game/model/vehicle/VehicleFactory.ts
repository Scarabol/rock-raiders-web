import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { WorldManager } from '../../WorldManager'
import { RaiderActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { VehicleEntity } from './VehicleEntity'
import { GameConfig } from '../../../cfg/GameConfig'

/**
 * @deprecated
 */
export class VehicleFactory {
    static createVehicleFromType(entityType: EntityType, worldMgr: WorldManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.hoverboard, ['Vehicles/Hoverboard'], RaiderActivity.Standhoverboard, RaiderActivity.Hoverboard)
            case EntityType.SMALL_DIGGER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallDigger, ['Vehicles/SmallDigger'], RaiderActivity.StandSMALLDIGGER, RaiderActivity.SMALLDIGGER)
            case EntityType.SMALL_TRUCK:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallTruck, ['Vehicles/SmallTruck'], RaiderActivity.StandSMALLTRUCK, RaiderActivity.SMALLTRUCK)
            case EntityType.SMALL_CAT:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallCat, ['Vehicles/SmallCat'], RaiderActivity.StandSMALLCAT, RaiderActivity.SMALLCAT)
            case EntityType.SMALL_MLP:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallMlp, ['Vehicles/SMLP'], RaiderActivity.StandSMALLMLP, RaiderActivity.SMALLMLP)
            case EntityType.SMALL_HELI:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallHeli, ['Vehicles/SmallHeli'], RaiderActivity.StandSMALLheli, RaiderActivity.SMALLheli)
            case EntityType.BULLDOZER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.bulldozer, ['Vehicles/Bulldozer'])
            case EntityType.WALKER_DIGGER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.walkerDigger, ['Vehicles/WalkerLegs', 'Vehicles/WalkerBody'])
            case EntityType.LARGE_MLP:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeMlp, ['Vehicles/LMLP'])
            case EntityType.LARGE_DIGGER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeDigger, ['Vehicles/LargeDigger'])
            case EntityType.LARGE_CAT:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeCat, ['Vehicles/LargeCat'], RaiderActivity.StandLARGECAT, RaiderActivity.LARGECAT)
            case EntityType.LARGE_HELI:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeHeli, ['Vehicles/LargeHeli'])
            default:
                throw new Error(`Unexpected vehicle type: ${EntityType[entityType]}`)
        }
    }

    static getVehicleStatsByType(entityType: EntityType): VehicleEntityStats {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return GameConfig.instance.stats.hoverboard
            case EntityType.SMALL_DIGGER:
                return GameConfig.instance.stats.smallDigger
            case EntityType.SMALL_TRUCK:
                return GameConfig.instance.stats.smallTruck
            case EntityType.SMALL_CAT:
                return GameConfig.instance.stats.smallCat
            case EntityType.SMALL_MLP:
                return GameConfig.instance.stats.smallMlp
            case EntityType.SMALL_HELI:
                return GameConfig.instance.stats.smallHeli
            case EntityType.BULLDOZER:
                return GameConfig.instance.stats.bulldozer
            case EntityType.WALKER_DIGGER:
                return GameConfig.instance.stats.walkerDigger
            case EntityType.LARGE_MLP:
                return GameConfig.instance.stats.largeMlp
            case EntityType.LARGE_DIGGER:
                return GameConfig.instance.stats.largeDigger
            case EntityType.LARGE_CAT:
                return GameConfig.instance.stats.largeCat
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
    }
}
