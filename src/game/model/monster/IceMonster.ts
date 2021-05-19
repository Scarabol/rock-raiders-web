import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { Monster } from './Monster'

export class IceMonster extends Monster {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.ICE_MONSTER, 'Creatures/IceMonster/IceMonster.ae')
    }

}
