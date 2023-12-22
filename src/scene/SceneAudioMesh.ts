import { SceneMesh } from './SceneMesh'
import { AudioListener, PositionalAudio } from 'three'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SoundManager } from '../audio/SoundManager'
import { resetAudioSafe } from '../audio/AudioUtil'
import { TILESIZE } from '../params'

export class SceneAudioMesh extends SceneMesh {
    readonly audioNode: PositionalAudio
    lastSfxName: string = null

    constructor(audioListener: AudioListener) {
        super()
        this.audioNode = new PositionalAudio(audioListener)
        this.audioNode.setRefDistance(TILESIZE * 5)
        this.audioNode.setRolloffFactor(10)
        this.add(this.audioNode)
    }

    update(elapsedMs: number) {
        super.update(elapsedMs)
        const sfxVolume = SaveGameManager.getSfxVolume()
        if (sfxVolume <= 0) return
        const sfxName = this.userData.sfxName
        if (this.lastSfxName === sfxName || !sfxName) return
        this.lastSfxName = sfxName
        this.audioNode.setVolume(sfxVolume)
        this.audioNode.onEnded = () => {
            resetAudioSafe(this.audioNode)
            this.lastSfxName = null
        }
        const audioBuffer = SoundManager.getSoundBuffer(sfxName)
        if (audioBuffer) {
            this.audioNode.setBuffer(audioBuffer)
            this.audioNode.play()
            SoundManager.playingAudio.add(this.audioNode)
        }
    }

    dispose() {
        super.dispose()
        resetAudioSafe(this.audioNode)
        this.lastSfxName = null
    }
}
