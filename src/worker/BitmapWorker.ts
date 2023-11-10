import { TypedWorkerThreaded } from './TypedWorker'
import { BitmapWithPalette } from '../resource/fileparser/BitmapWithPalette'
import { AbstractWorkerSystem } from './AbstractWorkerSystem'

export enum BitmapWorkerRequestType {
    DECODE_BITMAP = 1, // start with 1 for truthiness safety
    DECODE_BITMAP_ALPHA,
    DECODE_BITMAP_ALPHA_INDEX,
}

export class BitmapWorkerRequest {
    type: BitmapWorkerRequestType
    bitmapData: ArrayBuffer
    alphaIndex?: number
}

export class BitmapWorkerResponse {
    decoded: BitmapWithPalette
}

export class BitmapSystem extends AbstractWorkerSystem<BitmapWorkerRequest, BitmapWorkerResponse> {
    onMessageFromFrontend(workerRequestHash: string, request: BitmapWorkerRequest): BitmapWorkerResponse {
        switch (request.type) {
            case BitmapWorkerRequestType.DECODE_BITMAP:
                this.sendResponse(workerRequestHash, {decoded: BitmapWithPalette.decode(request.bitmapData)})
                break
            case BitmapWorkerRequestType.DECODE_BITMAP_ALPHA:
                this.sendResponse(workerRequestHash, {decoded: BitmapWithPalette.decode(request.bitmapData).applyAlpha()})
                break
            case BitmapWorkerRequestType.DECODE_BITMAP_ALPHA_INDEX:
                this.sendResponse(workerRequestHash, {decoded: BitmapWithPalette.decode(request.bitmapData).applyAlphaByIndex(request.alphaIndex)})
                break
        }
        return null
    }
}

const worker: Worker = self as any
new BitmapSystem(new TypedWorkerThreaded(worker))
