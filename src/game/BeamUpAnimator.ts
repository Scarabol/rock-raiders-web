import { Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { DeselectAll } from '../event/LocalEvents'
import { NATIVE_FRAMERATE, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { SceneEntity } from '../scene/SceneEntity'
import { AnimationGroup } from './model/anim/AnimationGroup'
import { SceneManager } from './SceneManager'

export interface BeamUpEntity {

    sceneMgr: SceneManager
    sceneEntity: SceneEntity

    disposeFromWorld()

}

export class BeamUpAnimator {

    entity: BeamUpEntity
    counter: number
    animGroup: AnimationGroup

    constructor(entity: BeamUpEntity) {
        this.entity = entity
        this.counter = 6 * TILESIZE
        EventBus.publishEvent(new DeselectAll())
        this.animGroup = new AnimationGroup('Mini-Figures/Pilot/VLP_TelepUp.lws', this.entity.sceneMgr.listener)
        this.animGroup.position.copy(this.entity.sceneEntity.position.clone())
        this.animGroup.rotateOnAxis(new Vector3(0, 1, 0), this.entity.sceneEntity.getHeading())
        this.entity.sceneMgr.scene.add(this.animGroup)
        this.animGroup.startAnimation(() => {
            this.entity.disposeFromWorld()
            this.entity.sceneMgr.scene.remove(this.animGroup)
        })
    }

    update(elapsedMs: number) {
        this.animGroup.update(elapsedMs)
        if (this.counter > 0) {
            this.counter--
            this.entity.sceneEntity.position.y += (TILESIZE / NATIVE_FRAMERATE) / 2 * (elapsedMs / NATIVE_UPDATE_INTERVAL)
        }
    }

}
