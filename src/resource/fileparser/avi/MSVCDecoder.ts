import { AVIVideoDecoder } from './AVIVideoStream'
import { getPixel, setPixel } from '../../../core/ImageHelper'
import { ByteStreamReader } from '../../../core/ByteStreamReader'
import { AVIVideoFormat } from './AVI'

export class MSVCDecoder implements AVIVideoDecoder {
    constructor(readonly videoFormat: AVIVideoFormat) {
        if (videoFormat.biBitCount !== 16) {
            throw new Error(`Unhandled video bit count ${videoFormat.biBitCount}`)
        }
    }

    decodeFrame(previousFrame: ImageData, chunkReader: ByteStreamReader): ImageData {
        let byteA = chunkReader.read8()
        let byteB = chunkReader.read8()
        const result = new ImageData(this.videoFormat.biWidth, this.videoFormat.biHeight)
        const blockRowLen = this.videoFormat.biWidth / 4
        const blockColHeight = this.videoFormat.biHeight / 4
        let blockIndex = 0
        while (blockIndex < blockRowLen * blockColHeight) {
            if (byteB < 0x80) {
                const colorA = chunkReader.read16()
                if (colorA & 0x8000) {
                    const quad1A = colorA
                    const quad1B = chunkReader.read16()
                    const quad2A = chunkReader.read16()
                    const quad2B = chunkReader.read16()
                    const quad3A = chunkReader.read16()
                    const quad3B = chunkReader.read16()
                    const quad4A = chunkReader.read16()
                    const quad4B = chunkReader.read16()
                    const blockColors: number[] = [
                        (byteA & 0b00000001) ? quad1A : quad1B, (byteA & 0b00000010) ? quad1A : quad1B,
                        (byteA & 0b00000100) ? quad2A : quad2B, (byteA & 0b00001000) ? quad2A : quad2B,
                        (byteA & 0b00010000) ? quad1A : quad1B, (byteA & 0b00100000) ? quad1A : quad1B,
                        (byteA & 0b01000000) ? quad2A : quad2B, (byteA & 0b10000000) ? quad2A : quad2B,
                        (byteB & 0b00000001) ? quad3A : quad3B, (byteB & 0b00000010) ? quad3A : quad3B,
                        (byteB & 0b00000100) ? quad4A : quad4B, (byteB & 0b00001000) ? quad4A : quad4B,
                        (byteB & 0b00010000) ? quad3A : quad3B, (byteB & 0b00100000) ? quad3A : quad3B,
                        (byteB & 0b01000000) ? quad4A : quad4B, (byteB & 0b10000000) ? quad4A : quad4B,
                    ]
                    this.writeBlockToImageData(blockColors, result, blockIndex, blockRowLen)
                } else {
                    const colorB = chunkReader.read16()
                    const blockColors = [
                        (byteA & 0b00000001) ? colorA : colorB, (byteA & 0b00000010) ? colorA : colorB,
                        (byteA & 0b00000100) ? colorA : colorB, (byteA & 0b00001000) ? colorA : colorB,
                        (byteA & 0b00010000) ? colorA : colorB, (byteA & 0b00100000) ? colorA : colorB,
                        (byteA & 0b01000000) ? colorA : colorB, (byteA & 0b10000000) ? colorA : colorB,
                        (byteB & 0b00000001) ? colorA : colorB, (byteB & 0b00000010) ? colorA : colorB,
                        (byteB & 0b00000100) ? colorA : colorB, (byteB & 0b00001000) ? colorA : colorB,
                        (byteB & 0b00010000) ? colorA : colorB, (byteB & 0b00100000) ? colorA : colorB,
                        (byteB & 0b01000000) ? colorA : colorB, (byteB & 0b10000000) ? colorA : colorB,
                    ]
                    this.writeBlockToImageData(blockColors, result, blockIndex, blockRowLen)
                }
            } else if (byteB < 0x84 || byteB >= 0x88) {
                const blockColor = (byteB << 8) + byteA
                const blockColors: number[] = [
                    blockColor, blockColor, blockColor, blockColor,
                    blockColor, blockColor, blockColor, blockColor,
                    blockColor, blockColor, blockColor, blockColor,
                    blockColor, blockColor, blockColor, blockColor
                ]
                this.writeBlockToImageData(blockColors, result, blockIndex, blockRowLen)
            } else {
                const n = (byteB - 0x84) * 256 + byteA
                this.copyFromPreviousFrame(previousFrame, result, blockIndex, n, blockRowLen)
                blockIndex += n - 1
            }
            blockIndex++
            byteA = chunkReader.read8()
            byteB = chunkReader.read8()
        }
        return result
    }

    writeBlockToImageData(blockColors: number[], imageData: ImageData, blockIndex: number, blockRowLen: number) {
        if (blockColors.length !== 16) throw new Error(`Invalid number of block colors given; got ${blockColors.length} instead of 16`)
        const blockX = (blockIndex % blockRowLen) * 4
        const blockY = imageData.height - 1 - Math.floor(blockIndex / blockRowLen) * 4
        for (let index = 0; index < 16; index++) {
            const x = index % 4
            const y = Math.floor(index / 4)
            const r = (blockColors[index] & 0b0111110000000000) >> (10 - 3)
            const g = (blockColors[index] & 0b0000001111100000) >> (5 - 3)
            const b = (blockColors[index] & 0b0000000000011111) << 3
            setPixel(imageData, blockX + x, blockY - y, r, g, b)
        }
    }

    copyFromPreviousFrame(previousFrame: ImageData, targetFrame: ImageData, blockIndex: number, numBlocks: number, blockRowLen: number) {
        for (let c = 0; c < numBlocks; c++) {
            const blockX = ((blockIndex + c) % blockRowLen) * 4
            const blockY = targetFrame.height - 1 - Math.floor((blockIndex + c) / blockRowLen) * 4
            for (let index = 0; index < 16; index++) {
                const x = index % 4
                const y = Math.floor(index / 4)
                const color = getPixel(previousFrame, blockX + x, blockY - y)
                setPixel(targetFrame, blockX + x, blockY - y, color.r, color.g, color.b)
            }
        }
    }
}
