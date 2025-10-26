import { BitmapWithPalette } from '../resource/fileparser/BitmapWithPalette'
import { BITMAP_WORKER_REQUEST_TYPE, BitmapSystem, BitmapWorkerRequest, BitmapWorkerResponse } from './BitmapWorker'
import { AbstractWorkerPool } from './AbstractWorkerPool'
import { TypedWorkerFallback, WorkerRequestMessage, WorkerResponseMessage } from './TypedWorker'

export class BitmapWorkerPool extends AbstractWorkerPool<BitmapWorkerRequest, BitmapWorkerResponse> {
    static readonly instance = new BitmapWorkerPool()

    protected createWorker() {
        return new Worker(new URL('./BitmapWorker', import.meta.url), {type: 'module'}) // do not change this line otherwise no worker.js is exported for production
    }

    protected attachFallbackSystem(worker: TypedWorkerFallback<WorkerRequestMessage<BitmapWorkerRequest>, WorkerResponseMessage<BitmapWorkerResponse>>) {
        new BitmapSystem(worker)
    }

    async decodeBitmap(data: ArrayBuffer): Promise<BitmapWithPalette> {
        const message = {type: BITMAP_WORKER_REQUEST_TYPE.decodeBitmap, bitmapData: data}
        const response = await this.processMessage(message)
        return response.decoded
    }

    async decodeBitmapWithAlpha(data: ArrayBuffer): Promise<BitmapWithPalette> {
        const message = {type: BITMAP_WORKER_REQUEST_TYPE.decodeBitmapAlpha, bitmapData: data}
        const response = await this.processMessage(message)
        return response.decoded
    }

    async decodeBitmapWithAlphaIndex(data: ArrayBuffer, alphaIndex: number): Promise<BitmapWithPalette> {
        const message = {type: BITMAP_WORKER_REQUEST_TYPE.decodeBitmapAlphaIndex, bitmapData: data, alphaIndex: alphaIndex}
        const response = await this.processMessage(message)
        return response.decoded
    }

    async decodeBitmapWithAlphaTranslucent(data: ArrayBuffer): Promise<BitmapWithPalette> {
        const message = {type: BITMAP_WORKER_REQUEST_TYPE.decodeBitmapAlphaTranslucent, bitmapData: data}
        const response = await this.processMessage(message)
        return response.decoded
    }
}
