import { PositionalAudio } from 'three'
import { SoundManager } from './SoundManager'

export function resetAudioSafe(audio: PositionalAudio): null {
    if (audio?.isPlaying) audio?.stop()
    SoundManager.playingAudio.delete(audio)
    return null
}
