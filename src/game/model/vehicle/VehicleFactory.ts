import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { BullDozer } from './entities/BullDozer'
import { Hoverboard } from './entities/Hoverboard'
import { LargeCat } from './entities/LargeCat'
import { LargeDigger } from './entities/LargeDigger'
import { LargeMlp } from './entities/LargeMlp'
import { SmallCat } from './entities/SmallCat'
import { SmallDigger } from './entities/SmallDigger'
import { SmallHeli } from './entities/SmallHeli'
import { SmallMlp } from './entities/SmallMlp'
import { SmallTruck } from './entities/SmallTruck'
import { WalkerDigger } from './entities/WalkerDigger'
import { VehicleEntity } from './VehicleEntity'

export class VehicleFactory {

    static createVehicleFromType(entityType: EntityType, sceneMgr: SceneManager, entityMgr: EntityManager): VehicleEntity {
        switch (entityType) {
            case EntityType.HOVERBOARD:
                return new Hoverboard(sceneMgr, entityMgr)
            case EntityType.SMALL_DIGGER:
                return new SmallDigger(sceneMgr, entityMgr)
            case EntityType.SMALL_TRUCK:
                return new SmallTruck(sceneMgr, entityMgr)
            case EntityType.SMALL_CAT:
                return new SmallCat(sceneMgr, entityMgr)
            case EntityType.SMALL_MLP:
                return new SmallMlp(sceneMgr, entityMgr)
            case EntityType.SMALL_HELI:
                return new SmallHeli(sceneMgr, entityMgr)
            case EntityType.BULLDOZER:
                return new BullDozer(sceneMgr, entityMgr)
            case EntityType.WALKER_DIGGER:
                return new WalkerDigger(sceneMgr, entityMgr)
            case EntityType.LARGE_MLP:
                return new LargeMlp(sceneMgr, entityMgr)
            case EntityType.LARGE_DIGGER:
                return new LargeDigger(sceneMgr, entityMgr)
            case EntityType.LARGE_CAT:
                return new LargeCat(sceneMgr, entityMgr)
            default:
                throw new Error('Unexpected vehicle type: ' + EntityType[entityType])
        }
    }

}
