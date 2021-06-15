import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { MonsterActivity } from '../activities/MonsterActivity'
import { EntityType } from '../EntityType'
import { MovableEntity } from '../MovableEntity'
import { PathTarget } from '../PathTarget'

export abstract class Monster extends MovableEntity {

    sceneEntity: AnimatedSceneEntity
    target: PathTarget[] = []

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, entityType: EntityType, aeFilename: string) {
        super(sceneMgr, entityMgr, entityType)
        this.sceneEntity = new AnimatedSceneEntity(sceneMgr, aeFilename)
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
    }

    removeFromScene() {
        this.sceneEntity.removeFromScene()
    }

    getRouteActivity(): MonsterActivity {
        return MonsterActivity.Route
    }

}
