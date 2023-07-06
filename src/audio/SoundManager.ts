import { AudioContext, PositionalAudio } from 'three'
import { Sample } from './Sample'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { VERBOSE } from '../params'

export class SoundManager {
    static sfxByKey: Map<string, ArrayBuffer> = new Map()
    static audioBufferCache: Map<string, AudioBuffer> = new Map()
    static audioContext: AudioContext
    static sfxAudioTarget: GainNode
    static readonly playingAudio: Set<PositionalAudio> = new Set()

    static {
        EventBus.registerEventListener(EventKey.PAUSE_GAME, () => this.playingAudio.forEach((a) => a.pause())) // XXX What if audio was paused for other reasons
        EventBus.registerEventListener(EventKey.UNPAUSE_GAME, () => this.playingAudio.forEach((a) => a.play()))
    }

    static playSample(sample: Sample) {
        this.playSound(Sample[sample])
    }

    static playSound(sfxName: string) {
        this.getSoundBuffer(sfxName).then((audioBuffer) => {
            try {
                if (!audioBuffer) return
                const source = SoundManager.audioContext.createBufferSource()
                source.buffer = audioBuffer
                source.connect(SoundManager.sfxAudioTarget)
                source.start()
            } catch (e) {
                console.error(e)
            }
        })
    }

    static async getSoundBuffer(sfxName: string): Promise<AudioBuffer> {
        sfxName = sfxName.toLowerCase()
        const cachedSound = SoundManager.audioBufferCache.get(sfxName)
        if (cachedSound) return cachedSound
        const sfxContent = this.sfxByKey.getOrUpdate(sfxName, () => {
            if (VERBOSE) console.warn(`Could not find SFX with name '${sfxName}'`)
            return new ArrayBuffer(0)
        })
        if (sfxContent.byteLength < 1) return null
        const data = sfxContent.slice(0) // slice used to create copy, because array gets auto detached after decode
        SoundManager.audioContext = SoundManager.audioContext || new (window['AudioContext'] || window['webkitAudioContext'])()
        SoundManager.sfxAudioTarget = SoundManager.sfxAudioTarget || SoundManager.audioContext.createGain()
        SoundManager.sfxAudioTarget.gain.value = SaveGameManager.currentPreferences.volumeSfx
        if (SaveGameManager.currentPreferences.toggleSfx) SoundManager.sfxAudioTarget.connect(SoundManager.audioContext.destination)
        const audioBuffer = await SoundManager.audioContext.decodeAudioData(data)
        SoundManager.audioBufferCache.set(sfxName, audioBuffer)
        return audioBuffer
    }

    static toggleSfx() {
        if (SaveGameManager.currentPreferences.toggleSfx) {
            SoundManager.sfxAudioTarget.connect(SoundManager.audioContext.destination)
        } else {
            SoundManager.sfxAudioTarget.disconnect()
        }
    }
}
