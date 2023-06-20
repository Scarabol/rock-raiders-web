import { PositionalAudio } from 'three'
import { SoundManager } from './SoundManager'

export function resetAudioSafe(audio: PositionalAudio): null {
    if (audio?.isPlaying) audio?.stop()
    SoundManager.loopedAudio.delete(audio)
    return null
}
