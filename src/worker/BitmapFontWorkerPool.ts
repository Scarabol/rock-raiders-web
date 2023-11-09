import { AbstractWorkerPool } from './AbstractWorkerPool'
import { TypedWorkerFallback, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'
import { BitmapFontSystem, BitmapFontWorkerRequest, BitmapFontWorkerRequestType, BitmapFontWorkerResponse } from './BitmapFontWorker'
import { SpriteImage } from '../core/Sprite'
import { imgDataToCanvas } from '../core/ImageHelper'
import { BitmapFontData } from '../core/BitmapFont'

export class BitmapFontWorkerPool extends AbstractWorkerPool<BitmapFontWorkerRequest, BitmapFontWorkerResponse> {
    readonly knownFonts: Set<string> = new Set()

    protected createWorker() {
        return new Worker(new URL('./BitmapFontWorker', import.meta.url), {type: 'module'}) // do not change this line otherwise no worker.js is exported for production
    }

    protected attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<BitmapFontWorkerRequest>, WorkerResponseMessage<BitmapFontWorkerResponse>>) {
        new BitmapFontSystem(worker)
    }

    async addFont(fontName: string, fontData: BitmapFontData): Promise<void> {
        if (this.knownFonts.has(fontName.toLowerCase())) {
            console.warn(`Font ${fontName} already known in pool`)
            return
        }
        this.knownFonts.add(fontName.toLowerCase())
        const message = {type: BitmapFontWorkerRequestType.ADD_FONT, fontName: fontName, fontData: fontData}
        this.broadcast(message)
    }

    async createTextImage(fontName: string, text?: string, maxWidth?: number, autoCenter: boolean = true): Promise<SpriteImage> {
        if (!text) return Promise.resolve(null)
        const message = {type: BitmapFontWorkerRequestType.CREATE_TEXT_IMAGE, fontName: fontName, text: text, maxWidth: maxWidth, autoCenter: autoCenter}
        const response = await this.processMessage(message)
        return response ? imgDataToCanvas(response.textImageData) : null
    }
}
