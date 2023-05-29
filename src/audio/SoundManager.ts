import { AudioContext } from 'three'
import { Sample } from './Sample'
import { SaveGameManager } from '../resource/SaveGameManager'
import { DEV_MODE } from '../params'

export class SoundManager {
    static sfxByKey: Map<string, any> = new Map()
    static audioBufferCache: Map<string, AudioBuffer> = new Map()
    static audioContext: AudioContext
    static sfxAudioTarget: GainNode

    static playSample(sample: Sample) {
        this.playSound(Sample[sample])
    }

    static playSound(sfxName: string) {
        this.getSoundBuffer(sfxName).then((audioBuffer) => {
            try {
                const source = SoundManager.audioContext.createBufferSource()
                source.buffer = audioBuffer
                source.connect(SoundManager.sfxAudioTarget)
                source.start()
            } catch (e) {
                console.error(e)
            }
        }).catch((e) => {
            if (!DEV_MODE) console.warn(e)
        })
    }

    static async getSoundBuffer(sfxName: string): Promise<AudioBuffer> {
        sfxName = sfxName.toLowerCase()
        const cachedSound = SoundManager.audioBufferCache.get(sfxName)
        if (cachedSound) return cachedSound
        const sfxContent = this.sfxByKey.get(sfxName)
        if (!sfxContent) return Promise.reject(`Could not find ${sfxName} in: ${Array.from(this.sfxByKey.keys())}`)
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
