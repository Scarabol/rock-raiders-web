import { clearTimeoutSafe } from '../../../core/Util'
import { MonsterActivity } from '../activities/activities/MonsterActivity'
import { MovableEntity } from '../MovableEntity'
import { PathTarget } from '../PathTarget'

export abstract class Monster extends MovableEntity {

    moveTimeout: NodeJS.Timeout
    target: PathTarget = null

    onLevelEnd() {
        this.moveTimeout = clearTimeoutSafe(this.moveTimeout)
        this.removeFromScene()
    }

    getRouteActivity(): MonsterActivity {
        return MonsterActivity.Route
    }

}
