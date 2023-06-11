import { AbstractWorkerSystem } from './AbstractWorkerSystem'
import { BitmapFont, BitmapFontData } from '../core/BitmapFont'
import { TypedWorkerThreaded } from './TypedWorker'

export enum BitmapFontWorkerRequestType {
    ADD_FONT = 1, // start with 1 for truthiness safety
    CREATE_TEXT_IMAGE,
}

export class BitmapFontWorkerRequest {
    type: BitmapFontWorkerRequestType
    fontName?: string
    fontData?: BitmapFontData
    text?: string
    maxWidth?: number
    autoCenter?: boolean
}

export class BitmapFontWorkerResponse {
    textImageData: ImageData
}

export class BitmapFontSystem extends AbstractWorkerSystem<BitmapFontWorkerRequest, BitmapFontWorkerResponse> {
    private readonly fontCache: Map<string, BitmapFont> = new Map()

    onMessageFromFrontend(workerRequestHash: string, request: BitmapFontWorkerRequest) {
        if (!request) return
        switch (request.type) {
            case BitmapFontWorkerRequestType.ADD_FONT:
                this.fontCache.set(request.fontName.toLowerCase(), new BitmapFont(request.fontData))
                this.sendResponse(workerRequestHash, null)
                break
            case BitmapFontWorkerRequestType.CREATE_TEXT_IMAGE:
                if (!request.fontName) {
                    console.error(`No fontname given for '${request.text}'`)
                    this.sendResponse(workerRequestHash, null)
                    return
                }
                const font = this.fontCache.get(request.fontName.toLowerCase())
                if (!font) {
                    console.error(`Unknown font '${request.fontName}' for '${request.text}'. Possible options are: ${Array.from(this.fontCache.keys())}`)
                    this.sendResponse(workerRequestHash, null)
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
