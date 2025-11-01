import { AbstractWorkerSystem } from './AbstractWorkerSystem'
import { BitmapFont, BitmapFontData } from '../core/BitmapFont'
import { TypedWorkerThreaded } from './TypedWorker'

export const BITMAP_FONT_WORKER_REQUEST_TYPE = {
    addFont: 1, // start with 1 for truthiness safety
    createTextImage: 2,
} as const
type BitmapFontWorkerRequestType = typeof BITMAP_FONT_WORKER_REQUEST_TYPE[keyof typeof BITMAP_FONT_WORKER_REQUEST_TYPE]

export interface BitmapFontWorkerRequest {
    type: BitmapFontWorkerRequestType
    fontName: string
    fontData?: BitmapFontData
    text?: string
    maxWidth?: number | undefined
    autoCenter?: boolean
}

export interface BitmapFontWorkerResponse {
    textImageData: ImageData | undefined
}

export class BitmapFontSystem extends AbstractWorkerSystem<BitmapFontWorkerRequest, BitmapFontWorkerResponse> {
    private readonly fontCache: Map<string, BitmapFont> = new Map()

    onMessageFromFrontend(workerRequestHash: string, request: BitmapFontWorkerRequest) {
        if (!request.fontName) {
            console.error(`No fontname given for '${request.text}'`)
            this.sendResponse(workerRequestHash, {textImageData: undefined})
            return
        }
        switch (request.type) {
            case BITMAP_FONT_WORKER_REQUEST_TYPE.addFont:
                if (!request.fontData) {
                    console.error(`No font data given for '${request.fontName}'`)
                    this.sendResponse(workerRequestHash, {textImageData: undefined})
                    return
                }
                this.fontCache.set(request.fontName.toLowerCase(), new BitmapFont(request.fontData))
                this.sendResponse(workerRequestHash, {textImageData: undefined})
                break
            case BITMAP_FONT_WORKER_REQUEST_TYPE.createTextImage:
                if (!request.text) {
                    console.error(`No text given for '${request.fontName}'`)
                    this.sendResponse(workerRequestHash, {textImageData: undefined})
                    return
                }
                const font = this.fontCache.get(request.fontName.toLowerCase())
                if (!font) {
                    console.error(`Unknown font '${request.fontName}' for '${request.text}'. Possible options are: ${Array.from(this.fontCache.keys())}`)
                    this.sendResponse(workerRequestHash, {textImageData: undefined})
                    return
                }
                const textImageData = font.createTextImageData(request.text, request.maxWidth, request.autoCenter)
                this.sendResponse(workerRequestHash, {textImageData: textImageData})
                break
        }
    }
}

const worker: Worker = self as any
new BitmapFontSystem(new TypedWorkerThreaded(worker))
