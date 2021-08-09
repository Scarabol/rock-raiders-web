import { PositionalAudio } from 'three'

export function resetAudioSafe(audio: PositionalAudio): null {
    if (audio?.isPlaying) audio?.stop()
    return null
}
