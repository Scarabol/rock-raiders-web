import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { ResourceCache } from '../../../resource/ResourceCache'
import { ResourceManager } from '../../../resource/ResourceManager'
import { WorldManager } from '../../WorldManager'
import { RaiderActivity } from '../anim/AnimationActivity'
import { EntityType } from '../EntityType'
import { VehicleEntity } from './VehicleEntity'

/**
 * @deprecated
 */
export class VehicleFactory {
    static createVehicleFromType(entityType: EntityType, worldMgr: WorldManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.hoverboard, ['Vehicles/Hoverboard'], RaiderActivity.Standhoverboard, RaiderActivity.Hoverboard)
            case EntityType.SMALL_DIGGER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallDigger, ['Vehicles/SmallDigger'], RaiderActivity.StandSMALLDIGGER, RaiderActivity.SMALLDIGGER)
            case EntityType.SMALL_TRUCK:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallTruck, ['Vehicles/SmallTruck'], RaiderActivity.StandSMALLTRUCK, RaiderActivity.SMALLTRUCK)
            case EntityType.SMALL_CAT:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallCat, ['Vehicles/SmallCat'], RaiderActivity.StandSMALLCAT, RaiderActivity.SMALLCAT)
            case EntityType.SMALL_MLP:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallMlp, ['Vehicles/SMLP'], RaiderActivity.StandSMALLMLP, RaiderActivity.SMALLMLP)
            case EntityType.SMALL_HELI:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallHeli, ['Vehicles/SmallHeli'], RaiderActivity.StandSMALLheli, RaiderActivity.SMALLheli)
            case EntityType.BULLDOZER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.bulldozer, ['Vehicles/Bulldozer'])
            case EntityType.WALKER_DIGGER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.walkerDigger, ['Vehicles/WalkerLegs', 'Vehicles/WalkerBody'])
            case EntityType.LARGE_MLP:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.largeMlp, ['Vehicles/LMLP'])
            case EntityType.LARGE_DIGGER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.largeDigger, ['Vehicles/LargeDigger'])
            case EntityType.LARGE_CAT:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.largeCat, ['Vehicles/LargeCat'], RaiderActivity.StandLARGECAT, RaiderActivity.LARGECAT)
            case EntityType.LARGE_HELI:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.largeHeli, ['Vehicles/LargeHeli'])
            default:
                throw new Error(`Unexpected vehicle type: ${EntityType[entityType]}`)
        }
    }

    static getVehicleStatsByType(entityType: EntityType): VehicleEntityStats {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return ResourceCache.configuration.stats.hoverboard
            case EntityType.SMALL_DIGGER:
                return ResourceCache.configuration.stats.smallDigger
            case EntityType.SMALL_TRUCK:
                return ResourceCache.configuration.stats.smallTruck
            case EntityType.SMALL_CAT:
                return ResourceCache.configuration.stats.smallCat
            case EntityType.SMALL_MLP:
                return ResourceCache.configuration.stats.smallMlp
            case EntityType.SMALL_HELI:
                return ResourceCache.configuration.stats.smallHeli
            case EntityType.BULLDOZER:
                return ResourceCache.configuration.stats.bulldozer
            case EntityType.WALKER_DIGGER:
                return ResourceCache.configuration.stats.walkerDigger
            case EntityType.LARGE_MLP:
                return ResourceCache.configuration.stats.largeMlp
            case EntityType.LARGE_DIGGER:
                return ResourceCache.configuration.stats.largeDigger
            case EntityType.LARGE_CAT:
                return ResourceCache.configuration.stats.largeCat
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
    }
}
