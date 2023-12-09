import { AVIReader, AVIVideoFormat, RRWVideoDecoder } from './AVIParser'
import { getPixel, setPixel } from '../../core/ImageHelper'

export class MSVCDecoder implements RRWVideoDecoder {
    readonly chunks: AVIReader[] = []
    readonly decoded: ImageData[] = []
    frameIndex: number = 0
    previousFrame: ImageData
    videoFormat: AVIVideoFormat

    initialize(chunks: AVIReader[], videoFormat: AVIVideoFormat): void {
        if (videoFormat.biBitCount !== 16) {
            throw new Error(`Unhandled video bit count ${videoFormat.biBitCount}`)
        }
        this.chunks.length = 0
        this.chunks.push(...chunks)
        this.videoFormat = videoFormat
    }

    getNextFrame(): ImageData {
        let frameData = this.decoded[this.frameIndex]
        if (!frameData) {
            frameData = this.decodeFrame(this.previousFrame, this.chunks[this.frameIndex], this.videoFormat.biWidth, this.videoFormat.biHeight)
            this.decoded[this.frameIndex] = frameData
            this.previousFrame = frameData
        }
        this.frameIndex = (this.frameIndex + 1) % this.chunks.length
        return frameData
    }

    decodeFrame(previousFrame: ImageData, aviReader: AVIReader, frameWidth: number, frameHeight: number): ImageData {
        let byteA = aviReader.read8()
        let byteB = aviReader.read8()
        const result = new ImageData(frameWidth, frameHeight)
        const blockRowLen = frameWidth / 4
        const blockColHeight = frameHeight / 4
        let blockIndex = 0
        while (blockIndex < blockRowLen * blockColHeight) {
            if (byteB < 0x80) {
                const colorA = aviReader.read16()
                if (colorA & 0x8000) {
                    const quad1A = colorA
                    const quad1B = aviReader.read16()
                    const quad2A = aviReader.read16()
                    const quad2B = aviReader.read16()
                    const quad3A = aviReader.read16()
                    const quad3B = aviReader.read16()
                    const quad4A = aviReader.read16()
                    const quad4B = aviReader.read16()
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
                    const colorB = aviReader.read16()
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
            byteA = aviReader.read8()
            byteB = aviReader.read8()
        }
        return result
    }

    writeBlockToImageData(blockColors: number[], imageData: ImageData, blockIndex: number, blockRowLen: number) {
        if (blockColors.length !== 16) throw new Error('Invalid block colors given')
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
