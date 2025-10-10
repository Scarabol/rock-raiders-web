import { AbstractWorkerPool } from './AbstractWorkerPool'
import { TypedWorkerFallback, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'
import { BITMAP_FONT_WORKER_REQUEST_TYPE, BitmapFontSystem, BitmapFontWorkerRequest, BitmapFontWorkerResponse } from './BitmapFontWorker'
import { SpriteImage } from '../core/Sprite'
import { imgDataToCanvas } from '../core/ImageHelper'
import { BitmapFontData } from '../core/BitmapFont'

export class BitmapFontWorkerPool extends AbstractWorkerPool<BitmapFontWorkerRequest, BitmapFontWorkerResponse> {
    static readonly instance = new BitmapFontWorkerPool()

    readonly knownFonts: Map<string, BitmapFontData> = new Map()

    setupPool(fontName: string, fontData: BitmapFontData) {
        this.startPool(4, {
            type: BITMAP_FONT_WORKER_REQUEST_TYPE.addFont,
            fontName: fontName,
            fontData: fontData,
        })
    }

    async addFont(fontName: string, fontData: BitmapFontData): Promise<void> {
        if (this.knownFonts.has(fontName.toLowerCase())) {
            console.warn(`Font ${fontName} already known in pool`)
            return
        }
        this.knownFonts.set(fontName.toLowerCase(), fontData)
        const message = {type: BITMAP_FONT_WORKER_REQUEST_TYPE.addFont, fontName: fontName, fontData: fontData}
        await Promise.all(this.broadcast(message))
    }

    async createTextImage(fontName: string | undefined, text: string | undefined, maxWidth?: number, autoCenter: boolean = true): Promise<SpriteImage | undefined> {
        if (!fontName || !text) return undefined
        const message = {type: BITMAP_FONT_WORKER_REQUEST_TYPE.createTextImage, fontName: fontName, text: text, maxWidth: maxWidth, autoCenter: autoCenter}
        const response = await this.processMessage(message)
        if (!response.textImageData) return undefined
        return imgDataToCanvas(response.textImageData)
    }

    getFontHeight(fontName: string): number {
        return this.knownFonts.get(fontName.toLowerCase())?.charHeight ?? 1
    }

    protected createWorker() {
        return new Worker(new URL('./BitmapFontWorker', import.meta.url), {type: 'module'}) // do not change this line otherwise no worker.js is exported for production
    }

    protected attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<BitmapFontWorkerRequest>, WorkerResponseMessage<BitmapFontWorkerResponse>>) {
        new BitmapFontSystem(worker)
    }
}
