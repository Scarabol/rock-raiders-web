import { cacheGetData } from '../resource/AssetCacheHelper'
import { SaveGameManager } from '../resource/SaveGameManager'
import { EventBroker } from '../event/EventBroker'
import { EventKey } from '../event/EventKeyEnum'

export class MusicManager {
    static readonly audioContext: AudioContext = new AudioContext()
    static readonly musicTracks: AudioBuffer[] = []
    static audioTarget?: GainNode
    static currentTrack?: AudioBufferSourceNode
    static firstUnpause: boolean = true
    static playNext: boolean = true

    static init() {
        this.musicTracks.length = 0
        ;(async () => {
            for (let c = 0; c < 10; c++) {
                try {
                    const musicData = await cacheGetData(`musictrack${c}`)
                    if (!musicData) continue
                    const audioBuffer = await this.audioContext.decodeAudioData(musicData)
                    this.musicTracks.push(audioBuffer)
                } catch (e) {
                    console.error(`Could not decode music track ${c}`, e)
                }
            }
            if (this.musicTracks.length < 1) console.warn('No music tracks found in cache')
            // TODO unpause might occur before decoding finished, better make this async
        })().then()
        this.audioTarget = this.audioContext.createGain()
        this.audioTarget.gain.value = SaveGameManager.getMusicVolume()
        this.audioTarget.connect(this.audioContext.destination)
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, () => {
            this.firstUnpause = true
        })
        EventBroker.subscribe(EventKey.UNPAUSE_GAME, () => {
            if (this.firstUnpause) {
                this.playTracks()
                this.firstUnpause = false
            }
        })
        EventBroker.subscribe(EventKey.GAME_RESULT_STATE, () => {
            this.stopTracks()
        })
        EventBroker.subscribe(EventKey.RESTART_GAME, () => {
            this.stopTracks()
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            this.audioTarget.gain.value = SaveGameManager.getMusicVolume()
            if (SaveGameManager.currentPreferences.toggleMusic) {
                this.playTracks()
            } else {
                this.stopTracks()
            }
        })
    }

    static playTracks() {
        try {
            this.playNext = true
            if (this.currentTrack) return // music already playing
            const audioBuffer = this.musicTracks.random() // TODO Consider CDStartTrack from config on first track
            if (!audioBuffer) return
            this.currentTrack = this.audioContext.createBufferSource()
            this.currentTrack.buffer = audioBuffer
            this.currentTrack.connect(this.audioTarget)
            this.currentTrack.start()
            this.currentTrack.addEventListener('ended', () => {
                this.currentTrack = undefined
                if (this.playNext) this.playTracks()
            })
        } catch (e) {
            console.error('Could not play music track', e)
        }
    }

    static stopTracks() {
        this.playNext = false
        this.currentTrack?.stop()
        this.currentTrack = undefined
    }
}
