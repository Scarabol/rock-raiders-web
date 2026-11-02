import { getAudioContext } from './AudioContext'
import { SaveGameManager } from '../resource/SaveGameManager'
import { NerpRunner } from '../nerp/NerpRunner'
import { VERBOSE } from '../params'
import { PRNG } from '../game/factory/PRNG'
import { clearTimeoutSafe } from '../core/Util'

export class SoundManager {
    private static readonly MISSING_SFX = ['SurfaceSFX_Tunnel'].map((n) => n.toLowerCase()) // ignore known sfx issues
    static readonly sfxBuffersByKey: Map<string, AudioBuffer[]> = new Map()
    private static audioId: number = 1 // start with 1 for truthiness safety
    private static voiceSource: AudioBufferSourceNode | undefined
    private static voiceBuffer: AudioBuffer | undefined
    private static voiceOffset = 0
    private static voiceStartedAt = 0
    private static voiceTimeout: NodeJS.Timeout | undefined
    static sfxAudioTarget: GainNode
    static skipVoiceLines: boolean = false

    static setupSfxAudioTarget(): GainNode {
        this.sfxAudioTarget = this.sfxAudioTarget || getAudioContext().createGain()
        this.sfxAudioTarget.gain.value = SaveGameManager.getSfxVolume()
        if (SaveGameManager.preferences.toggleSfx) {
            this.sfxAudioTarget.connect(getAudioContext().destination)
        } else {
            this.sfxAudioTarget.disconnect()
        }
        return this.sfxAudioTarget
    }

    static playVoice(soundName: string): AudioBufferSourceNode | undefined {
        if (this.skipVoiceLines) return undefined
        const buffer = this.getSoundBuffer(soundName)
        if (!buffer) return undefined
        this.voiceBuffer = buffer
        this.voiceOffset = 0
        const sound = this.startVoice(buffer, this.voiceOffset)
        if (!sound) return undefined
        this.skipVoiceLines = true
        return sound
    }

    static pauseVoice(): void {
        if (!this.voiceSource || !this.voiceBuffer) return
        this.voiceOffset += getAudioContext().currentTime - this.voiceStartedAt
        const voiceSource = this.voiceSource
        this.voiceSource = undefined
        voiceSource.stop()
    }

    static resumeVoice(): void {
        if (this.voiceSource || !this.voiceBuffer) return
        this.startVoice(this.voiceBuffer, this.voiceOffset)
    }

    static stopVoice(): void {
        const voiceSource = this.voiceSource
        this.voiceSource = undefined
        this.voiceBuffer = undefined
        this.voiceOffset = 0
        this.voiceStartedAt = 0
        this.voiceTimeout = clearTimeoutSafe(this.voiceTimeout)
        this.skipVoiceLines = false
        voiceSource?.stop()
    }

    private static startVoice(buffer: AudioBuffer, offset: number): AudioBufferSourceNode | undefined {
        try {
            const sound = getAudioContext().createBufferSource()
            sound.buffer = buffer
            sound.connect(this.setupSfxAudioTarget())
            sound.addEventListener('ended', () => {
                if (this.voiceSource !== sound) return
                this.voiceSource = undefined
                this.voiceBuffer = undefined
                this.voiceOffset = 0
                this.voiceStartedAt = 0
                this.voiceTimeout = setTimeout(() => {
                    this.voiceTimeout = undefined
                    this.skipVoiceLines = false
                }, NerpRunner.timeAddedAfterSample)
            }, { once: true })
            sound.start(0, offset)
            this.voiceSource = sound
            this.voiceStartedAt = getAudioContext().currentTime
            return sound
        } catch (e) {
            console.error('Could not play voice line', e)
            this.voiceBuffer = undefined
            return undefined
        }
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
            const source = getAudioContext().createBufferSource()
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

    static get nextAudioId(): number {
        this.audioId++
        return this.audioId
    }
}
