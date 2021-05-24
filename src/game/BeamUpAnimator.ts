import { Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { DeselectAll } from '../event/LocalEvents'
import { NATIVE_FRAMERATE, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { AnimationGroup } from './model/anim/AnimationGroup'
import { BaseEntity } from './model/BaseEntity'

export class BeamUpAnimator {

    entity: BaseEntity
    counter: number

    constructor(entity: BaseEntity) {
        this.entity = entity
        this.counter = 6 * TILESIZE
        EventBus.publishEvent(new DeselectAll())
        const animGroup = new AnimationGroup('Mini-Figures/Pilot/VLP_TelepUp.lws', this.entity.sceneMgr.listener)
        animGroup.position.copy(this.entity.getPosition())
        animGroup.rotateOnAxis(new Vector3(0, 1, 0), this.entity.getHeading())
        this.entity.sceneMgr.scene.add(animGroup)
        animGroup.startAnimation(() => {
            this.entity.removeFromScene()
            this.entity.sceneMgr.scene.remove(animGroup)
        })
        setInterval(() => this.update(NATIVE_UPDATE_INTERVAL), NATIVE_UPDATE_INTERVAL)
    }

    update(elapsedMs: number) {
        if (this.counter > 0) {
            this.counter--
            this.entity.sceneEntity.position.y += (TILESIZE / NATIVE_FRAMERATE) / 2 * (elapsedMs / NATIVE_UPDATE_INTERVAL)
        }
    }

}
