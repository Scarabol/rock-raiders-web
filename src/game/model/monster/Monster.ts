import { MonsterEntityStats } from '../../../cfg/GameStatsCfg'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { MovableEntity } from '../MovableEntity'

export abstract class Monster extends MovableEntity {
    sceneEntity: AnimatedSceneEntity
    monsterStats: MonsterEntityStats

    protected constructor(sceneMgr: SceneManager, entityMgr: EntityManager, aeFilename: string, stats: MonsterEntityStats) {
        super(sceneMgr, entityMgr)
        this.sceneEntity = new AnimatedSceneEntity(sceneMgr, aeFilename)
        this.monsterStats = stats
    }

    get stats(): MonsterEntityStats {
        return this.monsterStats
    }

    update(elapsedMs: number) {
        this.sceneEntity.update(elapsedMs)
    }

    disposeFromWorld() {
        this.sceneEntity.disposeFromScene()
    }
}
