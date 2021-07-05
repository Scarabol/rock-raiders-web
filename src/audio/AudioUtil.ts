import { PositionalAudio } from 'three'

export function resetAudioSafe(audio: PositionalAudio) {
    if (audio?.isPlaying) audio?.stop()
    return null
}
