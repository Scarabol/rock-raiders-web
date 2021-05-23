import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { Monster } from './Monster'

export class LavaMonster extends Monster {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.LAVA_MONSTER, 'Creatures/LavaMonster/LavaMonster.ae')
    }

}
