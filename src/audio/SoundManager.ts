import { AudioContext, AudioListener, PositionalAudio } from 'three'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventKey } from '../event/EventKeyEnum'
import { NerpRunner } from '../nerp/NerpRunner'
import { EventBroker } from '../event/EventBroker'
import { VERBOSE } from '../params'
import { PRNG } from '../game/factory/PRNG'

export class SoundManager {
    private static readonly MISSING_SFX = ['SurfaceSFX_Tunnel'].map((n) => n.toLowerCase()) // ignore known sfx issues
    static readonly playingAudio: Map<number, PositionalAudio> = new Map()
    static readonly sfxBuffersByKey: Map<string, AudioBuffer[]> = new Map()
    static readonly sceneAudioListener: AudioListener = new AudioListener()
    private static audioId: number = 1 // start with 1 for truthiness safety
    static sfxAudioTarget: GainNode
    static skipVoiceLines: boolean = false

    static init() {
        this.playingAudio.forEach((audio) => {
            if (audio?.isPlaying) audio.stop()
        })
        this.playingAudio.clear()
        EventBroker.subscribe(EventKey.PAUSE_GAME, () => this.playingAudio.forEach((a) => a.pause())) // XXX What if audio was paused for other reasons
        EventBroker.subscribe(EventKey.UNPAUSE_GAME, () => this.playingAudio.forEach((a) => !a.isPlaying && a.play()))
    }

    static setupSfxAudioTarget(): GainNode {
        this.sfxAudioTarget = this.sfxAudioTarget || AudioContext.getContext().createGain()
        this.sfxAudioTarget.gain.value = SaveGameManager.getSfxVolume()
        if (SaveGameManager.preferences.toggleSfx) {
            this.sfxAudioTarget.connect(AudioContext.getContext().destination)
        } else {
            this.sfxAudioTarget.disconnect()
        }
        return this.sfxAudioTarget
    }

    static playVoice(soundName: string): AudioBufferSourceNode | undefined {
        if (this.skipVoiceLines) return undefined
        const sound = this.playSfxSound(soundName)
        if (!sound) return undefined
        this.skipVoiceLines = true
        sound.addEventListener('ended', () => {
            setTimeout(() => {
                this.skipVoiceLines = false
            }, NerpRunner.timeAddedAfterSample)
        })
        return sound
    }

    static playLoopSound(soundName: string): AudioBufferSourceNode | undefined {
        const sound = this.playSfxSound(soundName)
        if (sound) sound.loop = true
        return sound
    }

    static playSfxSound(soundName: string): AudioBufferSourceNode | undefined {
        try {
            const audioBuffer = this.getSoundBuffer(soundName)
            if (!audioBuffer) return undefined
            const source = AudioContext.getContext().createBufferSource()
            source.buffer = audioBuffer
            source.connect(this.setupSfxAudioTarget())
            source.start()
            return source
        } catch (e) {
            console.error(`Could not play sound ${soundName}`, e)
            return undefined
        }
    }

    static getSoundBuffer(sfxName: string): AudioBuffer | undefined {
        sfxName = sfxName.toLowerCase()
        if (sfxName === 'sfx_null') return undefined
        return PRNG.unsafe.sample(this.sfxBuffersByKey.getOrUpdate(sfxName, () => {
            if (VERBOSE || !this.MISSING_SFX.includes(sfxName)) {
                console.warn(`Could not find SFX with name '${sfxName}'`)
            }
            return []
        }))
    }

    static stopAudio(audioId: number | undefined): undefined {
        if (!audioId) return undefined
        const audio = this.playingAudio.get(audioId)
        if (!audio) return undefined
        if (audio?.isPlaying) audio.stop()
        this.playingAudio.delete(audioId)
        return undefined
    }

    static get nextAudioId(): number {
        this.audioId++
        return this.audioId
    }
}
