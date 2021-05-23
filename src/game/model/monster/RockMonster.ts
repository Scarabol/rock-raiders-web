import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { EntityType } from '../EntityType'
import { Monster } from './Monster'

export class RockMonster extends Monster {

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        super(sceneMgr, entityMgr, EntityType.ROCK_MONSTER, 'Creatures/RMonster/RMonster.ae')
    }

}
