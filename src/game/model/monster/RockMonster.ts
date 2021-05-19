import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { Monster } from './Monster'

export class RockMonster extends Monster {

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        super(worldMgr, sceneMgr, EntityType.ROCK_MONSTER, 'Creatures/RMonster/RMonster.ae')
    }

}
