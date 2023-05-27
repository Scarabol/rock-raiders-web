import { AudioContext } from 'three'
import { Sample } from './Sample'
import { SaveGameManager } from '../resource/SaveGameManager'

export class SoundManager {
    static sfxByKey: Map<string, any> = new Map()
    static audioBufferCache: Map<string, AudioBuffer> = new Map()
    static audioContext: AudioContext
    static sfxAudioTarget: GainNode

    static playSample(sample: Sample) {
        this.playSound(Sample[sample])
    }

    static playSound(sfxName: string) {
        try {
            this.getSoundBuffer(sfxName).then((audioBuffer) => {
                try {
                    const source = SoundManager.audioContext.createBufferSource()
                    source.buffer = audioBuffer
                    source.connect(SoundManager.sfxAudioTarget)
                    source.start()
                } catch (e) {
                    console.error(e)
                }
            })
        } catch (e) {
            console.error(e)
        }
    }

    static getSoundBuffer(sfxName: string): Promise<AudioBuffer> {
        sfxName = sfxName.toLowerCase()
        return new Promise<AudioBuffer>((resolve) => {
            const cachedSound = SoundManager.audioBufferCache.get(sfxName)
            if (cachedSound) {
                resolve(cachedSound)
                return
            }
            const sfxContent = this.sfxByKey.get(sfxName)
            if (!sfxContent) {
                console.error(`Could not find ${sfxName} in: `, this.sfxByKey)
                return
            }
            const data = sfxContent.slice(0) // slice used to create copy, because array gets auto detached after decode
            SoundManager.audioContext = SoundManager.audioContext || new (window['AudioContext'] || window['webkitAudioContext'])()
            SoundManager.sfxAudioTarget = SoundManager.sfxAudioTarget || SoundManager.audioContext.createGain()
            SoundManager.sfxAudioTarget.gain.value = SaveGameManager.currentPreferences.volumeSfx
            SoundManager.sfxAudioTarget.connect(SoundManager.audioContext.destination)
            SoundManager.audioContext.decodeAudioData(data).then((audioBuffer) => {
                SoundManager.audioBufferCache.set(sfxName, audioBuffer)
                resolve(audioBuffer)
            })
        })
    }
}
