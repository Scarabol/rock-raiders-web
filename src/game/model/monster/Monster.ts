import { clearTimeoutSafe } from '../../../core/Util'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { MonsterActivity } from '../activities/MonsterActivity'
import { EntitySuperType, EntityType } from '../EntityType'
import { MovableEntity } from '../MovableEntity'
import { PathTarget } from '../PathTarget'

export abstract class Monster extends MovableEntity {

    moveTimeout: NodeJS.Timeout
    target: PathTarget[] = []

    protected constructor(worldMgr: WorldManager, sceneMgr: SceneManager, entityType: EntityType, aeFilename: string) {
        super(worldMgr, sceneMgr, EntitySuperType.MONSTER, entityType, aeFilename)
    }

    onLevelEnd() {
        this.moveTimeout = clearTimeoutSafe(this.moveTimeout)
        this.removeFromScene()
    }

    getRouteActivity(): MonsterActivity {
        return MonsterActivity.Route
    }

}
