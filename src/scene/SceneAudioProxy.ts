import { Object3D, Vector3 } from 'three'
import { Updatable } from '../game/model/Updateable'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventBroker } from '../event/EventBroker'
import { SceneAudioMoveEvent, SceneAudioRemoveEvent } from '../event/WorldEvents'
import { SoundManager } from '../audio/SoundManager'

export class SceneAudioProxy extends Object3D implements Updatable {
    readonly audioId: number = SoundManager.nextAudioId
    readonly lastPos: Vector3 = new Vector3()
    lastActive: boolean = true
    lastSfxName: string = ''

    update(_elapsedMs: number): void {
        const sfxVolume = SaveGameManager.getSfxVolume()
        const active = sfxVolume > 0 && this.isVisible()
        // TODO Send play/pause updates when shown/hidden?
        if (active) { // TODO Only send events/updates with low framerate?
            const currentPos = this.getWorldPosition(new Vector3())
            if (currentPos.distanceToSquared(this.lastPos) > 1) { // TODO Adjust distance threshold
                EventBroker.publish(new SceneAudioMoveEvent(this.audioId, currentPos.clone()))
                this.lastPos.copy(currentPos)
            }
        }
    }

    private isVisible(): boolean {
        let hiddenObj: Object3D | null = this
        while (hiddenObj?.visible) {
            hiddenObj = hiddenObj.parent
        }
        return !hiddenObj
    }

    dispose() {
        EventBroker.publish(new SceneAudioRemoveEvent(this.audioId))
        this.lastPos.set(0, 0, 0)
        this.lastActive = true
        this.lastSfxName = ''
    }
}
