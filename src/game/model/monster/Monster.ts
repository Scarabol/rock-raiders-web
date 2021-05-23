import { clearTimeoutSafe } from '../../../core/Util'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { MonsterActivity } from '../activities/MonsterActivity'
import { EntityType } from '../EntityType'
import { MovableEntity } from '../MovableEntity'
import { PathTarget } from '../PathTarget'

export abstract class Monster extends MovableEntity {

    moveTimeout: NodeJS.Timeout
    target: PathTarget[] = []

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType, aeFilename: string) {
        super(sceneMgr, entityMgr, entityType, aeFilename)
    }

    removeFromScene() {
        super.removeFromScene()
        this.moveTimeout = clearTimeoutSafe(this.moveTimeout)
    }

    getRouteActivity(): MonsterActivity {
        return MonsterActivity.Route
    }

}
