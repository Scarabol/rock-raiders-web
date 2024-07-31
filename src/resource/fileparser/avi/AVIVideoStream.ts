import { ByteStreamReader } from '../../../core/ByteStreamReader'
import { SpriteContext, SpriteImage } from '../../../core/Sprite'
import { MSVCDecoder } from './MSVCDecoder'
import { AVIStreamHeader, AVIVideoFormat } from './AVI'

export interface AVIVideoDecoder {
    decodeFrame(previousFrame: ImageData, aviReader: ByteStreamReader): ImageData
}

export class AVIVideoStream {
    readonly frameChunks: ByteStreamReader[] = []
    readonly framesDecoded: ImageData[] = []
    readonly canvas: SpriteImage
    readonly context: SpriteContext
    readonly decoder: AVIVideoDecoder
    frameIndex: number = 0

    constructor(
        readonly streamIndex: number,
        readonly streamHeader: AVIStreamHeader,
        readonly videoFormat: AVIVideoFormat,
    ) {
        this.canvas = document.createElement('canvas')
        this.canvas.width = videoFormat.biWidth
        this.canvas.height = videoFormat.biHeight
        const context = this.canvas.getContext('2d')
        if (!context) throw new Error('Failed to get context for video frame canvas')
        this.context = context

        switch (streamHeader.fccHandler) {
            case 'MSVC':
            case 'CRAM':
            case 'WHAM':
                this.decoder = new MSVCDecoder(this.videoFormat)
                break
            default:
                throw new Error(`Unhandled video codec ${streamHeader.fccHandler}`)
        }
    }

    setFrameChunks(chunks: ByteStreamReader[]) {
        this.frameChunks.push(...chunks)
    }

    getNextFrame(): SpriteImage {
        if (this.frameChunks.length > 0) {
            this.framesDecoded[this.frameIndex] = this.framesDecoded[this.frameIndex] ?? this.decoder.decodeFrame(this.framesDecoded[this.frameIndex - 1], this.frameChunks[this.frameIndex])
            this.context.putImageData(this.framesDecoded[this.frameIndex], 0, 0)
            this.frameIndex = (this.frameIndex + 1) % this.frameChunks.length
        }
        return this.canvas
    }
}
