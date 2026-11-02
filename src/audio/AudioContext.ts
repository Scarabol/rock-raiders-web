import { AudioContext as ThreeAudioContext } from 'three'

export function getAudioContext(): globalThis.AudioContext {
    return ThreeAudioContext.getContext() as unknown as globalThis.AudioContext
}
