import { AudioListener, PositionalAudio, Scene } from 'three'
import { EventBroker } from '../event/EventBroker'
import { EventKey } from '../event/EventKeyEnum'
import { SceneAudioAddEvent, SceneAudioListenerEvent, SceneAudioMoveEvent, SceneAudioRemoveEvent } from '../event/WorldEvents'
import { NATIVE_UPDATE_INTERVAL, TILESIZE } from '../params'
import { SaveGameManager } from '../resource/SaveGameManager'
import { SoundManager } from '../audio/SoundManager'
import { clearIntervalSafe } from '../core/Util'
import { PRNG } from '../game/factory/PRNG'

export class SceneAudioManager {
    readonly audioScene: Scene = new Scene()
    readonly sceneAudioListener: AudioListener = new AudioListener()
    readonly audioIdToAudio: Map<number, PositionalAudio> = new Map()
    interval: NodeJS.Timeout | undefined // TODO Replace interval with update() calls

    constructor() {
        EventBroker.subscribe(EventKey.SCENE_AUDIO_LISTENER, (event: SceneAudioListenerEvent) => {
            this.sceneAudioListener.position.copy(event.position)
            this.sceneAudioListener.quaternion.copy(event.quaternion)
        })
        EventBroker.subscribe(EventKey.SCENE_AUDIO_ADD, (event: SceneAudioAddEvent) => {
            if (!event.audioId || !event.sfxName) return
            let audioNode = this.audioIdToAudio.get(event.audioId)
            if (!audioNode) {
                const audioBuffer = SoundManager.getSoundBuffer(event.sfxName)
                if (!audioBuffer) {
                    console.warn('Cannot play scene audio, missing buffer for sfx:', event.sfxName)
                    return
                }
                audioNode = new PositionalAudio(this.sceneAudioListener)
                audioNode.setRefDistance(TILESIZE * 5)
                audioNode.setBuffer(audioBuffer)
                this.audioIdToAudio.set(event.audioId, audioNode)
                this.audioScene.add(audioNode)
            }
            audioNode.position.copy(event.position)
            audioNode.setVolume(SaveGameManager.getSfxVolume())
            audioNode.setPlaybackRate(SaveGameManager.getGameSpeedMultiplier())
            audioNode.loop = event.loop
            if (!event.loop) {
                audioNode.onEnded = () => {
                    this.audioIdToAudio.delete(event.audioId)
                    this.audioScene.remove(audioNode)
                }
            }
            if (!audioNode.isPlaying) {
                audioNode.play(PRNG.unsafe.randInt(100) / 1000) // slight delay to avoid audio artifacts when many sounds start simultaneously
            }
        })
        EventBroker.subscribe(EventKey.SCENE_AUDIO_REMOVE, (event: SceneAudioRemoveEvent) => {
            if (!event.audioId) return
            const audioNode = this.audioIdToAudio.get(event.audioId)
            if (!audioNode) return
            if (audioNode.isPlaying) audioNode.stop()
            this.audioIdToAudio.delete(event.audioId)
            this.audioScene.remove(audioNode)
        })
        EventBroker.subscribe(EventKey.SCENE_AUDIO_MOVE, (event: SceneAudioMoveEvent) => {
            if (!event.audioId) return
            const audioNode = this.audioIdToAudio.get(event.audioId)
            if (!audioNode) return
            audioNode.position.copy(event.position)
        })
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_PREFERENCES, () => {
            const volume = SaveGameManager.getSfxVolume()
            const gameSpeedMultiplier = SaveGameManager.getGameSpeedMultiplier()
            for (const [, audioNode] of this.audioIdToAudio) {
                audioNode.setVolume(volume)
                audioNode.setPlaybackRate(gameSpeedMultiplier)
            }
        })
        EventBroker.subscribe(EventKey.PAUSE_GAME, () => {
            for (const [, a] of this.audioIdToAudio) a.pause()
        })
        EventBroker.subscribe(EventKey.UNPAUSE_GAME, () => {
            for (const [, a] of this.audioIdToAudio) {
                if (!a.isPlaying) a.play() // XXX What if audio was paused for other reasons?
            }
        })
    }

    startScene() {
        this.audioScene.add(this.sceneAudioListener)
        this.interval = clearIntervalSafe(this.interval)
        this.interval = setInterval(() => {
            this.audioScene.updateMatrixWorld()
        }, NATIVE_UPDATE_INTERVAL)
    }

    dispose() {
        for (const [, audio] of this.audioIdToAudio) {
            if (audio.isPlaying) audio.stop()
        }
        this.audioScene.clear()
        this.interval = clearIntervalSafe(this.interval)
    }
}
