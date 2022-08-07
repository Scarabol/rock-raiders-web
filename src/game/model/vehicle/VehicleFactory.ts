import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { ResourceCache } from '../../../resource/ResourceCache'
import { ResourceManager } from '../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../scene/entities/VehicleSceneEntity'
import { WalkerDiggerSceneEntity } from '../../../scene/entities/WalkerDiggerSceneEntity'
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
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.hoverboard, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/Hoverboard'), RaiderActivity.Standhoverboard, RaiderActivity.Hoverboard)
            case EntityType.SMALL_DIGGER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallDigger, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallDigger'), RaiderActivity.StandSMALLDIGGER, RaiderActivity.SMALLDIGGER)
            case EntityType.SMALL_TRUCK:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallTruck, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallTruck'), RaiderActivity.StandSMALLTRUCK, RaiderActivity.SMALLTRUCK)
            case EntityType.SMALL_CAT:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallCat, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallCat'), RaiderActivity.StandSMALLCAT, RaiderActivity.SMALLCAT)
            case EntityType.SMALL_MLP:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallMlp, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SMLP'), RaiderActivity.StandSMALLMLP, RaiderActivity.SMALLMLP)
            case EntityType.SMALL_HELI:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.smallHeli, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallHeli'), RaiderActivity.StandSMALLheli, RaiderActivity.SMALLheli)
            case EntityType.BULLDOZER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.bulldozer, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/Bulldozer'))
            case EntityType.WALKER_DIGGER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.walkerDigger, new WalkerDiggerSceneEntity(worldMgr.sceneMgr))
            case EntityType.LARGE_MLP:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.largeMlp, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/LMLP'))
            case EntityType.LARGE_DIGGER:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.largeDigger, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/LargeDigger'))
            case EntityType.LARGE_CAT:
                return new VehicleEntity(entityType, worldMgr, ResourceManager.configuration.stats.largeCat, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/LargeCat'), RaiderActivity.StandLARGECAT, RaiderActivity.LARGECAT)
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
