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
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.Hoverboard, new VehicleSceneEntity(sceneMgr, 'Vehicles/Hoverboard/Hoverboard.ae'))
            case EntityType.SMALL_DIGGER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.SmallDigger, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallDigger/SmallDigger.ae'))
            case EntityType.SMALL_TRUCK:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.SmallTruck, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallTruck/SmallTruck.ae'))
            case EntityType.SMALL_CAT:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.SmallCat, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallCat/SmallCat.ae'))
            case EntityType.SMALL_MLP:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.Smallmlp, new VehicleSceneEntity(sceneMgr, 'Vehicles/SMLP/SMLP.ae'))
            case EntityType.SMALL_HELI:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.SmallHeli, new VehicleSceneEntity(sceneMgr, 'Vehicles/SmallHeli/SmallHeli.ae'))
            case EntityType.BULLDOZER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.Bulldozer, new VehicleSceneEntity(sceneMgr, 'Vehicles/Bulldozer/Bulldozer.ae'))
            case EntityType.WALKER_DIGGER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.WalkerDigger, new WalkerDiggerSceneEntity(sceneMgr))
            case EntityType.LARGE_MLP:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.LargeMLP, new VehicleSceneEntity(sceneMgr, 'Vehicles/LMLP/LMLP.ae'))
            case EntityType.LARGE_DIGGER:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.LargeDigger, new VehicleSceneEntity(sceneMgr, 'Vehicles/LargeDigger/LargeDigger.ae'))
            case EntityType.LARGE_CAT:
                return new VehicleEntity(sceneMgr, entityMgr, entityType, ResourceManager.stats.LargeCat, new VehicleSceneEntity(sceneMgr, 'Vehicles/LargeCat/LargeCat.ae'))
            default:
                throw new Error(`Unexpected vehicle type: ${EntityType[entityType]}`)
        }
    }
}
