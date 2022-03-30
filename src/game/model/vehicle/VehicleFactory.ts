import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { ResourceCache } from '../../../resource/ResourceCache'
import { ResourceManager } from '../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../scene/entities/VehicleSceneEntity'
import { WalkerDiggerSceneEntity } from '../../../scene/entities/WalkerDiggerSceneEntity'
import { WorldManager } from '../../WorldManager'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { VehicleEntity } from './VehicleEntity'

export class VehicleFactory {
    static createVehicleFromType(entityType: EntityType, worldMgr: WorldManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.Hoverboard, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/Hoverboard/Hoverboard.ae'), RaiderActivity.Standhoverboard, RaiderActivity.Hoverboard)
            case EntityType.SMALL_DIGGER:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.SmallDigger, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallDigger/SmallDigger.ae'), RaiderActivity.StandSMALLDIGGER, RaiderActivity.SMALLDIGGER)
            case EntityType.SMALL_TRUCK:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.SmallTruck, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallTruck/SmallTruck.ae'), RaiderActivity.StandSMALLTRUCK, RaiderActivity.SMALLTRUCK)
            case EntityType.SMALL_CAT:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.SmallCat, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallCat/SmallCat.ae'), RaiderActivity.StandSMALLCAT, RaiderActivity.SMALLCAT)
            case EntityType.SMALL_MLP:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.Smallmlp, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SMLP/SMLP.ae'), RaiderActivity.StandSMALLMLP, RaiderActivity.SMALLMLP)
            case EntityType.SMALL_HELI:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.SmallHeli, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/SmallHeli/SmallHeli.ae'), RaiderActivity.StandSMALLheli, RaiderActivity.SMALLheli)
            case EntityType.BULLDOZER:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.Bulldozer, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/Bulldozer/Bulldozer.ae'))
            case EntityType.WALKER_DIGGER:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.WalkerDigger, new WalkerDiggerSceneEntity(worldMgr.sceneMgr))
            case EntityType.LARGE_MLP:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.LargeMLP, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/LMLP/LMLP.ae'))
            case EntityType.LARGE_DIGGER:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.LargeDigger, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/LargeDigger/LargeDigger.ae'))
            case EntityType.LARGE_CAT:
                return new VehicleEntity(worldMgr, ResourceManager.configuration.stats.LargeCat, new VehicleSceneEntity(worldMgr.sceneMgr, 'Vehicles/LargeCat/LargeCat.ae'), RaiderActivity.StandLARGECAT, RaiderActivity.LARGECAT)
            default:
                throw new Error(`Unexpected vehicle type: ${EntityType[entityType]}`)
        }
    }

    static getVehicleStatsByType(entityType: EntityType): VehicleEntityStats {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return ResourceCache.configuration.stats.Hoverboard
            case EntityType.SMALL_DIGGER:
                return ResourceCache.configuration.stats.SmallDigger
            case EntityType.SMALL_TRUCK:
                return ResourceCache.configuration.stats.SmallTruck
            case EntityType.SMALL_CAT:
                return ResourceCache.configuration.stats.SmallCat
            case EntityType.SMALL_MLP:
                return ResourceCache.configuration.stats.Smallmlp
            case EntityType.SMALL_HELI:
                return ResourceCache.configuration.stats.SmallHeli
            case EntityType.BULLDOZER:
                return ResourceCache.configuration.stats.Bulldozer
            case EntityType.WALKER_DIGGER:
                return ResourceCache.configuration.stats.WalkerDigger
            case EntityType.LARGE_MLP:
                return ResourceCache.configuration.stats.LargeMLP
            case EntityType.LARGE_DIGGER:
                return ResourceCache.configuration.stats.LargeDigger
            case EntityType.LARGE_CAT:
                return ResourceCache.configuration.stats.LargeCat
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
    }
}
