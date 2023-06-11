import { TypedWorkerThreaded } from './TypedWorker'
import { BitmapWithPalette } from '../resource/wadworker/parser/BitmapWithPalette'
import { AbstractWorkerSystem } from './AbstractWorkerSystem'

export enum BitmapWorkerRequestType {
    DECODE_BITMAP = 1, // start with 1 for truthiness safety
    DECODE_BITMAP_ALPHA,
    DECODE_BITMAP_ALPHA_INDEX,
}

export class BitmapWorkerRequest {
    type: BitmapWorkerRequestType
    bitmapData: Uint8Array
    alphaIndex?: number
}

export class BitmapWorkerResponse {
    decoded: BitmapWithPalette
}

export class BitmapSystem extends AbstractWorkerSystem<BitmapWorkerRequest, BitmapWorkerResponse> {
    onMessageFromFrontend(request: BitmapWorkerRequest): BitmapWorkerResponse {
        switch (request.type) {
            case BitmapWorkerRequestType.DECODE_BITMAP:
                return {decoded: BitmapWithPalette.decode(request.bitmapData)}
            case BitmapWorkerRequestType.DECODE_BITMAP_ALPHA:
                return {decoded: BitmapWithPalette.decode(request.bitmapData).applyAlpha()}
            case BitmapWorkerRequestType.DECODE_BITMAP_ALPHA_INDEX:
                return {decoded: BitmapWithPalette.decode(request.bitmapData).applyAlphaByIndex(request.alphaIndex)}
        }
        return null
    }
}

const worker: Worker = self as any
new BitmapSystem(new TypedWorkerThreaded(worker))
