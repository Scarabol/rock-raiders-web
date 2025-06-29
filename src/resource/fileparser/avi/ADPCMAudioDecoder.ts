import { AVIAudioDecoder } from './AVIAudioStream'
import { AVIReader } from './AVIReader'
import { AVIAudioFormat } from './AVI'

// Inspired by https://github.com/Snack-X/node-ms-adpcm/blob/master/index.js

export class ADPCMAudioDecoder implements AVIAudioDecoder {
    static readonly ADAPTATION_TABLE = [
        230, 230, 230, 230, 307, 409, 512, 614,
        768, 614, 512, 409, 307, 230, 230, 230,
    ]

    coefficient1: number[] = [256, 512, 0, 192, 240, 460, 392]
    coefficient2: number[] = [0, -256, 0, 64, 0, -208, -232]

    constructor(
        readonly audioFormat: AVIAudioFormat,
    ) {
        if (audioFormat.extra) {
            this.coefficient1 = audioFormat.extra.coefficientPairs[0]
            this.coefficient2 = audioFormat.extra.coefficientPairs[1]
        }
    }

    decode(buf: AVIReader, channels: number, wSamplesPerBlock: number): number[][] {
        const coefficient1: number[] = []
        const coefficient2: number[] = []
        const delta: number[] = []
        const sample1: number[] = []
        const sample2: number[] = []
        // Read MS-ADPCM chunk header
        for (let i = 0; i < channels; i++) {
            const predictor = ADPCMAudioDecoder.clamp(buf.read8(), 0, 6)
            coefficient1[i] = this.coefficient1[predictor]
            coefficient2[i] = this.coefficient2[predictor]
        }
        for (let i = 0; i < channels; i++) {
            delta.push(buf.read16Signed())
        }
        for (let i = 0; i < channels; i++) {
            sample1.push(buf.read16Signed())
        }
        for (let i = 0; i < channels; i++) {
            sample2.push(buf.read16Signed())
        }
        // Decode chunk
        const output: number[][] = []
        for (let i = 0; i < channels; i++) {
            output[i] = [sample2[i], sample1[i]]
        }
        let channel = 0
        while (buf.hasMoreData()) {
            const byte = buf.read8()
            ;[byte >> 4, byte & 0xf].forEach((nibble) => {
                // Expand nibble
                const signed = 8 <= nibble ? nibble - 16 : nibble
                let expanded = ((
                    sample1[channel] * coefficient1[channel] +
                    sample2[channel] * coefficient2[channel]
                ) >> 8) + (signed * delta[channel])
                expanded = ADPCMAudioDecoder.clamp(expanded, -0x8000, 0x7fff)
                sample2[channel] = sample1[channel]
                sample1[channel] = expanded
                delta[channel] = Math.floor(ADPCMAudioDecoder.ADAPTATION_TABLE[nibble] * delta[channel] / 256)
                if (delta[channel] < 16) delta[channel] = 16
                output[channel].push(expanded)
                channel = (channel + 1) % channels
            })
            if (output[0].length >= wSamplesPerBlock) {
                break
            }
        }
        // Normalize output to [-1, 1]
        return output.map((d) => d.map((e) => e / 32768))
    }

    static clamp(val: number, min: number, max: number): number {
        if (val < min) return min
        else if (val > max) return max
        else return val
    }
}
