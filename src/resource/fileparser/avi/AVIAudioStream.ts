import { ByteStreamReader } from '../../../core/ByteStreamReader'
import { AVIAudioFormat, AVIStreamHeader, WAVE_FORMAT_MSADPCM } from './AVI'
import { ADPCMAudioDecoder } from './ADPCMAudioDecoder'

export interface AVIAudioDecoder {
    decode(buf: ByteStreamReader, channels: number, wSamplesPerBlock: number): number[][]
}

export class AVIAudioStream {
    readonly frameChunks: ByteStreamReader[] = []
    readonly decoder: AVIAudioDecoder

    constructor(
        readonly streamIndex: number,
        readonly streamHeader: AVIStreamHeader,
        readonly audioFormat: AVIAudioFormat,
    ) {
        switch (audioFormat.wFormatTag) {
            case WAVE_FORMAT_MSADPCM:
                this.decoder = new ADPCMAudioDecoder(audioFormat)
                break
            default:
                throw new Error(`Unhandled audio codec ${audioFormat.wFormatTag}`)
        }
    }

    setFrameChunks(chunks: ByteStreamReader[]) {
        this.frameChunks.push(...chunks)
    }
}
