import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { WorldManager } from '../../WorldManager'
import { RAIDER_ACTIVITY } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { VehicleEntity } from './VehicleEntity'
import { GameConfig } from '../../../cfg/GameConfig'

export class VehicleFactory {
    static createVehicleFromType(entityType: EntityType, worldMgr: WorldManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.hoverboard, ['Vehicles/Hoverboard'], RAIDER_ACTIVITY.standHoverboard, RAIDER_ACTIVITY.hoverboard)
            case EntityType.SMALL_DIGGER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallDigger, ['Vehicles/SmallDigger'], RAIDER_ACTIVITY.standSmallDigger, RAIDER_ACTIVITY.smallDigger)
            case EntityType.SMALL_TRUCK:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallTruck, ['Vehicles/SmallTruck'], RAIDER_ACTIVITY.standSmallTruck, RAIDER_ACTIVITY.smallTruck)
            case EntityType.SMALL_CAT:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallCat, ['Vehicles/SmallCat'], RAIDER_ACTIVITY.standSmallCat, RAIDER_ACTIVITY.smallCat)
            case EntityType.SMALL_MLP:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallMlp, ['Vehicles/SMLP'], RAIDER_ACTIVITY.standSmallMLP, RAIDER_ACTIVITY.smallMlp)
            case EntityType.SMALL_HELI:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.smallHeli, ['Vehicles/SmallHeli'], RAIDER_ACTIVITY.standSmallHeli, RAIDER_ACTIVITY.smallHeli)
            case EntityType.BULLDOZER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.bulldozer, ['Vehicles/Bulldozer'])
            case EntityType.WALKER_DIGGER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.walkerDigger, ['Vehicles/WalkerLegs', 'Vehicles/WalkerBody'])
            case EntityType.LARGE_MLP:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeMlp, ['Vehicles/LMLP'])
            case EntityType.LARGE_DIGGER:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeDigger, ['Vehicles/LargeDigger'])
            case EntityType.LARGE_CAT:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeCat, ['Vehicles/LargeCat'], RAIDER_ACTIVITY.standLargeCat, RAIDER_ACTIVITY.largeCat)
            case EntityType.LARGE_HELI:
                return new VehicleEntity(entityType, worldMgr, GameConfig.instance.stats.largeHeli, ['Vehicles/LargeHeli'])
            default:
                throw new Error(`Unexpected vehicle type: ${entityType}`)
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
                throw new Error(`Unexpected entity type: ${entityType}`)
        }
    }
}
