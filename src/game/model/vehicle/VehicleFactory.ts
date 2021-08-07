import { VehicleEntityStats } from '../../../cfg/GameStatsCfg'
import { ResourceCache } from '../../../resource/ResourceCache'
import { ResourceManager } from '../../../resource/ResourceManager'
import { VehicleSceneEntity } from '../../../scene/entities/VehicleSceneEntity'
import { WalkerDiggerSceneEntity } from '../../../scene/entities/WalkerDiggerSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { VehicleEntity } from './VehicleEntity'

export class VehicleFactory {
    static createVehicleFromType(entityType: EntityType, sceneMgr: SceneManager, entityMgr: EntityManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.Hoverboard, new VehicleSceneEntity(sceneMgr, 'Vehicles/Hoverboard/Hoverboard.ae'))
            case EntityType.SMALL_DIGGER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.SmallDigger, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallDigger/SmallDigger.ae'))
            case EntityType.SMALL_TRUCK:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.SmallTruck, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallTruck/SmallTruck.ae'))
            case EntityType.SMALL_CAT:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.SmallCat, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallCat/SmallCat.ae'))
            case EntityType.SMALL_MLP:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.Smallmlp, new VehicleSceneEntity(sceneMgr, 'Vehicles/SMLP/SMLP.ae'))
            case EntityType.SMALL_HELI:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.SmallHeli, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallHeli/SmallHeli.ae'))
            case EntityType.BULLDOZER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.Bulldozer, new VehicleSceneEntity(sceneMgr, 'Vehicles/Bulldozer/Bulldozer.ae'))
            case EntityType.WALKER_DIGGER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.WalkerDigger, new WalkerDiggerSceneEntity(sceneMgr))
            case EntityType.LARGE_MLP:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.LargeMLP, new VehicleSceneEntity(sceneMgr, 'Vehicles/LMLP/LMLP.ae'))
            case EntityType.LARGE_DIGGER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.LargeDigger, new VehicleSceneEntity(sceneMgr, 'Vehicles/LargeDigger/LargeDigger.ae'))
            case EntityType.LARGE_CAT:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.configuration.stats.LargeCat, new VehicleSceneEntity(sceneMgr, 'Vehicles/LargeCat/LargeCat.ae'))
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
