import { TypedWorkerThreaded } from './TypedWorker'
import { BitmapWithPalette } from '../resource/fileparser/BitmapWithPalette'
import { AbstractWorkerSystem } from './AbstractWorkerSystem'

export enum BitmapWorkerRequestType {
    DECODE_BITMAP = 1, // start with 1 for truthiness safety
    DECODE_BITMAP_ALPHA,
    DECODE_BITMAP_ALPHA_INDEX,
    DECODE_BITMAP_ALPHA_TRANSLUCENT,
}

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
            case BitmapWorkerRequestType.DECODE_BITMAP_ALPHA_TRANSLUCENT:
                this.sendResponse(workerRequestHash, {decoded: BitmapWithPalette.decode(request.bitmapData).applyAlphaTranslucent()})
                break
        }
    }
}

const worker: Worker = self as any
new BitmapSystem(new TypedWorkerThreaded(worker))
