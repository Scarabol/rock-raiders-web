import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { Monster } from './Monster'

export class LavaMonster extends Monster {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.LAVA_MONSTER, 'Creatures/LavaMonster/LavaMonster.ae')
    }

}
