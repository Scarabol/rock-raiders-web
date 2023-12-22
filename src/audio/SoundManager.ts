import { AudioContext, PositionalAudio } from 'three'
import { Sample } from './Sample'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { NerpRunner } from '../nerp/NerpRunner'

export class SoundManager {
    static readonly playingAudio: Set<PositionalAudio> = new Set()
    static readonly sfxBuffersByKey: Map<string, AudioBuffer[]> = new Map()
    static sfxAudioTarget: GainNode
    static skipVoiceLines: boolean = false

    static {
        EventBus.registerEventListener(EventKey.PAUSE_GAME, () => this.playingAudio.forEach((a) => a.pause())) // XXX What if audio was paused for other reasons
        EventBus.registerEventListener(EventKey.UNPAUSE_GAME, () => this.playingAudio.forEach((a) => a.play()))
    }

    static setupSfxAudioTarget(): GainNode {
        SoundManager.sfxAudioTarget = SoundManager.sfxAudioTarget || AudioContext.getContext().createGain()
        SoundManager.sfxAudioTarget.gain.value = SaveGameManager.getSfxVolume()
        if (SaveGameManager.currentPreferences.toggleSfx) {
            SoundManager.sfxAudioTarget.connect(AudioContext.getContext().destination)
        } else {
            SoundManager.sfxAudioTarget.disconnect()
        }
        return SoundManager.sfxAudioTarget
    }

    static playSample(sample: Sample, isVoice: boolean) {
        this.playSound(Sample[sample], isVoice)
    }

    static playSound(soundName: string, isVoice: boolean): AudioBufferSourceNode {
        if (isVoice && this.skipVoiceLines) return null
        this.skipVoiceLines = isVoice
        try {
            const audioBuffer = this.getSoundBuffer(soundName)
            if (!audioBuffer) return null
            const source = AudioContext.getContext().createBufferSource()
            source.buffer = audioBuffer
            source.connect(SoundManager.setupSfxAudioTarget())
            source.start()
            if (isVoice) setTimeout(() => this.skipVoiceLines = false, audioBuffer.duration * 1000 + NerpRunner.timeAddedAfterSample)
            return source
        } catch (e) {
            console.error(`Could not play sound ${soundName}`, e)
            return null
        }
    }

    static getSoundBuffer(sfxName: string): AudioBuffer {
        return this.sfxBuffersByKey.getOrUpdate(sfxName.toLowerCase(), () => {
            console.warn(`Could not find SFX with name '${sfxName}'`)
            return []
        }).random()
    }
}
