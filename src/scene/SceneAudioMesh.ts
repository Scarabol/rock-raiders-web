import { Object3D, Vector3 } from 'three'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SoundManager } from '../audio/SoundManager'
import { SceneMesh } from './SceneMesh'
import { EventBroker } from '../event/EventBroker'
import { SceneAudioAddEvent, SceneAudioRemoveEvent } from '../event/WorldEvents'

export interface SceneAudioMeshUserData {
    sfxNameAnimation: string | undefined
}

export class SceneAudioMesh extends SceneMesh {
    declare userData: SceneAudioMeshUserData
    audioId: number | undefined
    lastSfxName: string = ''

    override update(_elapsedMs: number) {
        const sfxVolume = SaveGameManager.getSfxVolume()
        if (sfxVolume <= 0 || !this.isVisible()) return
        const sfxName = this.userData.sfxNameAnimation || ''
        if (!sfxName) return
        if (this.lastSfxName !== sfxName) {
            if (this.audioId) EventBroker.publish(new SceneAudioRemoveEvent(this.audioId))
            this.audioId = SoundManager.nextAudioId
        }
        if (this.audioId) EventBroker.publish(new SceneAudioAddEvent(this.audioId, sfxName, false, this.getWorldPosition(new Vector3())))
        this.lastSfxName = sfxName
    }

    private isVisible(): boolean {
        let hiddenObj: Object3D | null = this
        while (hiddenObj?.visible) {
            hiddenObj = hiddenObj.parent
        }
        return !hiddenObj
    }

    override dispose() {
        if (this.audioId) EventBroker.publish(new SceneAudioRemoveEvent(this.audioId))
        this.audioId = undefined
        this.lastSfxName = ''
    }
}
