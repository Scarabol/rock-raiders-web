import { ResourceCache } from '../resource/ResourceCache'
import { Sample } from './Sample'

export class SoundManager {

    static audioBufferCache: Map<string, AudioBuffer> = new Map()
    static audioContext

    static playSample(sample: Sample) {
        this.playSound(Sample[sample])
    }

    static playSound(sfxName: string) {
        try {
            this.getSoundBuffer(sfxName).then((audioBuffer) => {
                try {
                    const source = SoundManager.audioContext.createBufferSource()
                    source.buffer = audioBuffer
                    source.connect(SoundManager.audioContext.destination)
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
        const cachedSound = SoundManager.audioBufferCache.get(sfxName)
        if (cachedSound) return new Promise<AudioBuffer>((resolve) => resolve(cachedSound))
        const sfxContent = ResourceCache.sfxByKey.get(sfxName)
        if (!sfxContent) {
            console.error('Could not find ' + sfxName + ' in: ', ResourceCache.sfxByKey)
            return
        }
        const data = sfxContent.slice(0) // slice used to create copy, because array gets auto detached after decode
        return new Promise<AudioBuffer>((resolve) => {
            SoundManager.audioContext = SoundManager.audioContext || new (window['AudioContext'] || window['webkitAudioContext'])()
            SoundManager.audioContext.decodeAudioData(data).then((audioBuffer) => {
                SoundManager.audioBufferCache.set(sfxName, audioBuffer)
                resolve(audioBuffer)
            })
        })
    }

}
