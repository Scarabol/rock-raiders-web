import { TypedWorkerThreaded } from './TypedWorker'
import { BitmapWithPalette } from '../resource/fileparser/BitmapWithPalette'
import { AbstractWorkerSystem } from './AbstractWorkerSystem'

export const BITMAP_WORKER_REQUEST_TYPE = {
    decodeBitmap: 1, // start with 1 for truthiness safety
    decodeBitmapAlpha: 2,
    decodeBitmapAlphaIndex: 3,
    decodeBitmapAlphaTranslucent: 4,
} as const
type BitmapWorkerRequestType = typeof BITMAP_WORKER_REQUEST_TYPE[keyof typeof BITMAP_WORKER_REQUEST_TYPE]

export interface BitmapWorkerRequest {
    type: BitmapWorkerRequestType
    bitmapData: ArrayBuffer
    alphaIndex?: number
}

export interface BitmapWorkerResponse {
    decoded: BitmapWithPalette
}

export class BitmapSystem extends AbstractWorkerSystem<BitmapWorkerRequest, BitmapWorkerResponse> {
    onMessageFromFrontend(workerRequestHash: string, request: BitmapWorkerRequest): void {
        const decoded = BitmapWithPalette.decode(new DataView(request.bitmapData))
        switch (request.type) {
            case BITMAP_WORKER_REQUEST_TYPE.decodeBitmap:
                this.sendResponse(workerRequestHash, {decoded: decoded})
                break
            case BITMAP_WORKER_REQUEST_TYPE.decodeBitmapAlpha:
                this.sendResponse(workerRequestHash, {decoded: decoded.applyAlpha()})
                break
            case BITMAP_WORKER_REQUEST_TYPE.decodeBitmapAlphaIndex:
                if (request.alphaIndex === undefined || request.alphaIndex === null) {
                    console.error(`No alpha index given for bitmap decode request`)
                    return
                }
                this.sendResponse(workerRequestHash, {decoded: decoded.applyAlphaByIndex(request.alphaIndex)})
                break
            case BITMAP_WORKER_REQUEST_TYPE.decodeBitmapAlphaTranslucent:
                this.sendResponse(workerRequestHash, {decoded: decoded.applyAlphaTranslucent()})
                break
        }
    }
}

const worker: Worker = self as any
new BitmapSystem(new TypedWorkerThreaded(worker))
