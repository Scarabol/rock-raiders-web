import { BitmapWithPalette } from '../resource/fileparser/BitmapWithPalette'
import { BitmapSystem, BitmapWorkerRequest, BitmapWorkerRequestType, BitmapWorkerResponse } from './BitmapWorker'
import { AbstractWorkerPool } from './AbstractWorkerPool'
import { TypedWorkerFallback, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export class BitmapWorkerPool extends AbstractWorkerPool<BitmapWorkerRequest, BitmapWorkerResponse> {
    protected createWorker() {
        return new Worker(new URL('./BitmapWorker', import.meta.url), {type: 'module'}) // do not change this line otherwise no worker.js is exported for production
    }

    protected attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<BitmapWorkerRequest>, WorkerResponseMessage<BitmapWorkerResponse>>) {
        new BitmapSystem(worker)
    }

    async decodeBitmap(data: ArrayBuffer): Promise<BitmapWithPalette> {
        const message = {type: BitmapWorkerRequestType.DECODE_BITMAP, bitmapData: data}
        const response = await this.processMessage(message)
        return response.decoded
    }

    async decodeBitmapWithAlpha(data: ArrayBuffer): Promise<BitmapWithPalette> {
        const message = {type: BitmapWorkerRequestType.DECODE_BITMAP_ALPHA, bitmapData: data}
        const response = await this.processMessage(message)
        return response.decoded
    }

    async decodeBitmapWithAlphaIndex(data: ArrayBuffer, alphaIndex: number): Promise<BitmapWithPalette> {
        const message = {type: BitmapWorkerRequestType.DECODE_BITMAP_ALPHA_INDEX, bitmapData: data, alphaIndex: alphaIndex}
        const response = await this.processMessage(message)
        return response.decoded
    }
}
