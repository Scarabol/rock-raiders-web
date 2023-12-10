import { AVIAudioFormat, AVIReader, RRWAudioDecoder } from './AVIParser'

// Inspired by https://github.com/Snack-X/node-ms-adpcm/blob/master/index.js

export class ADPCMAudioDecoder implements RRWAudioDecoder {

    static readonly ADAPTATION_TABLE = [
        230, 230, 230, 230, 307, 409, 512, 614,
        768, 614, 512, 409, 307, 230, 230, 230,
    ]

    coeff1: number[] = []
    coeff2: number[] = []
    delta: number[] = []
    sample1: number[] = []
    sample2: number[] = []

    chunks: AVIReader[] = []
    audioFormat: AVIAudioFormat = null
    chunkIndex: number = 0

    constructor(
        readonly chunkReader: AVIReader,
        readonly coefficient1: number[] = [256, 512, 0, 192, 240, 460, 392],
        readonly coefficient2: number[] = [0, -256, 0, 64, 0, -208, -232],
    ) {
    }

    initialize(chunks: AVIReader[], audioFormat: AVIAudioFormat): void {
        this.chunks = chunks
        this.audioFormat = audioFormat
        this.chunkIndex = 0
        const wSamplesPerBlock = this.chunkReader.read16()
        const wNumCoeff = this.chunkReader.read16()
        // TODO use coeffs from here (if provided) instead of default ones
        for (let c = 0; c < wNumCoeff; c++) {
            this.chunkReader.read16Signed()
            this.chunkReader.read16Signed()
        }
        // TODO do not decode all
        const channel1 = []
        const channel2 = []
        this.chunks.forEach((chunk) => {
            while (chunk.hasMoreData()) {
                const decoded = this.decode(chunk, audioFormat.nChannels, wSamplesPerBlock)
                decoded[1] = decoded[1] ?? decoded[0] // TODO Avoid workaround for mono sound videos
                channel1.push(...decoded[0])
                channel2.push(...decoded[1])
            }
        })
        // TODO remove testing code here and return audio buffer instead
        const firstDecoded = [channel1, channel2]
        const frameCount = firstDecoded[0].length
        const audioCtx: AudioContext = new (window.AudioContext || window.webkitAudioContext)()
        const gainNode = audioCtx.createGain()
        gainNode.connect(audioCtx.destination)
        gainNode.gain.value = 0.5
        const audioBuffer = audioCtx.createBuffer(audioFormat.nChannels, frameCount, audioFormat.nSamplesPerSec)
        for (let channel = 0; channel < audioFormat.nChannels; channel++) {
            const buffering = audioBuffer.getChannelData(channel)
            for (let frame = 0; frame < frameCount; frame++) {
                buffering[frame] = firstDecoded[channel][frame] / 32768
            }
        }
        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        source.loop = true
        source.connect(gainNode)
        source.start()
    }

    // TODO add method to get next frame
    // getNextFrame() {
    //     if (this.chunkIndex >= this.chunks.length) return null
    //     return this.decode(this.chunks[this.chunkIndex], this.audioFormat.nChannels)
    // }

    decode(buf: AVIReader, channels: number, wSamplesPerBlock: number): number[][] {
        this.coeff1.length = 0
        this.coeff2.length = 0
        this.delta.length = 0
        this.sample1.length = 0
        this.sample2.length = 0
        // Read MS-ADPCM header
        for (let i = 0; i < channels; i++) {
            const predictor = this.clamp(buf.read8(), 0, 6)
            this.coeff1[i] = this.coefficient1[predictor]
            this.coeff2[i] = this.coefficient2[predictor]
        }
        for (let i = 0; i < channels; i++) {
            this.delta.push(buf.read16Signed())
        }
        for (let i = 0; i < channels; i++) {
            this.sample1.push(buf.read16Signed())
        }
        for (let i = 0; i < channels; i++) {
            this.sample2.push(buf.read16Signed())
        }
        // Decode
        const output: number[][] = []
        for (let i = 0; i < channels; i++) {
            output[i] = [this.sample2[i], this.sample1[i]]
        }
        let channel = 0
        while (buf.hasMoreData()) {
            const byte = buf.read8()
            output[channel].push(this.expandNibble(byte >> 4, channel))
            channel = (channel + 1) % channels
            output[channel].push(this.expandNibble(byte & 0xf, channel))
            channel = (channel + 1) % channels
            if (output[0].length >= wSamplesPerBlock) {
                break
            }
        }
        return output
    }

    expandNibble(nibble: number, channel: number): number {
        const signed = 8 <= nibble ? nibble - 16 : nibble

        let predictor = ((
            this.sample1[channel] * this.coeff1[channel] +
            this.sample2[channel] * this.coeff2[channel]
        ) >> 8) + (signed * this.delta[channel])

        predictor = this.clamp(predictor, -0x8000, 0x7fff)

        this.sample2[channel] = this.sample1[channel]
        this.sample1[channel] = predictor

        this.delta[channel] = Math.floor(ADPCMAudioDecoder.ADAPTATION_TABLE[nibble] * this.delta[channel] / 256)
        if (this.delta[channel] < 16) this.delta[channel] = 16

        return predictor
    }

    clamp(val: number, min: number, max: number): number {
        if (val < min) return min
        else if (val > max) return max
        else return val
    }
}
