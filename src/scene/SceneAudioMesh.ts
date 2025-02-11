import { Object3D, PositionalAudio } from 'three'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SoundManager } from '../audio/SoundManager'
import { SceneMesh } from './SceneMesh'
import { TILESIZE } from '../params'

export interface SceneAudioMeshUserData {
    sfxNameAnimation?: string
}

export class SceneAudioMesh extends SceneMesh {
    declare userData: SceneAudioMeshUserData
    audioNode?: PositionalAudio
    lastSfxName: string = ''

    update(elapsedMs: number) {
        const sfxVolume = SaveGameManager.getSfxVolume()
        if (sfxVolume <= 0 || !this.isVisible()) return
        const sfxName = this.userData.sfxNameAnimation || ''
        if (!sfxName || (this.lastSfxName === sfxName && this.audioNode?.isPlaying)) return
        this.lastSfxName = sfxName
        const audioBuffer = SoundManager.getSoundBuffer(sfxName)
        if (!audioBuffer) return
        if (!this.audioNode) {
            this.audioNode = new PositionalAudio(SoundManager.sceneAudioListener)
            this.audioNode.setRefDistance(TILESIZE * 5)
            this.audioNode.setRolloffFactor(10)
            this.add(this.audioNode)
            this.audioNode.onEnded = () => {
                SoundManager.stopAudio(this.audioNode)
            }
        }
        this.audioNode.setVolume(sfxVolume)
        this.audioNode.setBuffer(audioBuffer)
        this.audioNode.play()
        SoundManager.playingAudio.add(this.audioNode)
    }

    private isVisible(): boolean {
        let hiddenObj: Object3D | null = this
        while (hiddenObj?.visible) {
            hiddenObj = hiddenObj.parent
        }
        return !hiddenObj
    }

    dispose() {
        SoundManager.stopAudio(this.audioNode)
        this.lastSfxName = ''
    }
}
