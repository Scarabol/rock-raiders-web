import { Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { DeselectAll } from '../event/LocalEvents'
import { NATIVE_FRAMERATE, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { AnimationGroup } from './model/anim/AnimationGroup'
import { BuildingEntity } from './model/building/BuildingEntity'
import { FulfillerEntity } from './model/FulfillerEntity'

type BeamUpEntity = BuildingEntity | FulfillerEntity

export class BeamUpAnimator {

    entity: BeamUpEntity
    counter: number

    constructor(entity: BeamUpEntity) {
        this.entity = entity
        this.counter = 6 * TILESIZE
        EventBus.publishEvent(new DeselectAll())
        const animGroup = new AnimationGroup('Mini-Figures/Pilot/VLP_TelepUp.lws', this.entity.sceneMgr.listener)
        animGroup.position.copy(this.entity.sceneEntity.position.clone())
        animGroup.rotateOnAxis(new Vector3(0, 1, 0), this.entity.sceneEntity.getHeading())
        this.entity.sceneMgr.scene.add(animGroup)
        animGroup.startAnimation(() => {
            this.entity.removeFromScene()
            this.entity.sceneMgr.scene.remove(animGroup)
        })
    }

    update(elapsedMs: number) {
        if (this.counter > 0) {
            this.counter--
            this.entity.sceneEntity.position.y += (TILESIZE / NATIVE_FRAMERATE) / 2 * (elapsedMs / NATIVE_UPDATE_INTERVAL)
        }
    }

}
