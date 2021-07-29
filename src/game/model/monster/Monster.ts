import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
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

    disposeFromWorld() {
        this.sceneEntity.disposeFromScene()
    }

    getSpeed(): number {
        return this.stats.RouteSpeed * (this.isOnPath() ? this.stats.PathCoef : 1)
    }
}
