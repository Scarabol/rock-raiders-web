import { EventBus } from '../event/EventBus'
import { DeselectAll } from '../event/LocalEvents'
import { NATIVE_FRAMERATE, NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { SceneEntity } from '../scene/SceneEntity'
import { Disposable } from './model/Disposable'
import { WorldManager } from './WorldManager'

export interface BeamUpEntity extends Disposable {
    worldMgr: WorldManager
    sceneEntity: SceneEntity
}

export class BeamUpAnimator {
    entity: BeamUpEntity
    counter: number

    constructor(entity: BeamUpEntity) {
        this.entity = entity
        this.counter = 6 * TILESIZE
        EventBus.publishEvent(new DeselectAll())
        this.entity.worldMgr.entityMgr.addMiscAnim('Mini-Figures/Pilot/VLP_TelepUp.lws', this.entity.sceneEntity.position, this.entity.sceneEntity.getHeading())
    }

    update(elapsedMs: number) {
        if (this.counter > 0) {
            this.counter--
            this.entity.sceneEntity.position.y += (TILESIZE / NATIVE_FRAMERATE) / 2 * (elapsedMs / NATIVE_UPDATE_INTERVAL)
        } else if (this.entity) {
            this.entity.disposeFromWorld()
            this.entity = null
        }
    }
}
