import { clearTimeoutSafe } from '../../../core/Util'
import { MonsterActivity } from '../activities/MonsterActivity'
import { EntitySuperType, EntityType } from '../EntityType'
import { MovableEntity } from '../MovableEntity'
import { PathTarget } from '../PathTarget'

export abstract class Monster extends MovableEntity {

    moveTimeout: NodeJS.Timeout
    target: PathTarget = null

    protected constructor(entityType: EntityType, aeFilename: string) {
        super(EntitySuperType.MONSTER, entityType, aeFilename)
    }

    onLevelEnd() {
        this.moveTimeout = clearTimeoutSafe(this.moveTimeout)
        this.removeFromScene()
    }

    getRouteActivity(): MonsterActivity {
        return MonsterActivity.Route
    }

}
