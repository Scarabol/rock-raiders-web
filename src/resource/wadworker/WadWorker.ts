import '../../core'
import { TypedWorkerBackend, TypedWorkerThreaded } from '../../worker/TypedWorker'
import { InitLoadingMessage } from './InitLoadingMessage'
import { WorkerResponse } from '../../worker/WorkerResponse'
import { WadLoader } from './WadLoader'
import { WadWorkerMessage } from './WadWorkerMessage'
import { GameConfig } from '../../cfg/GameConfig'

export class WadWorker {
    constructor(worker: TypedWorkerBackend<InitLoadingMessage, WorkerResponse>) {
        const wadLoader = new WadLoader()
        // set callbacks on wad loader
        wadLoader.onMessage = (text: string) => worker.sendResponse(WadWorkerMessage.createTextMessage(text))
        wadLoader.onCacheMiss = (cacheIdentifier: string) => worker.sendResponse(WadWorkerMessage.createCacheMissed(cacheIdentifier))
        wadLoader.onInitialLoad = (totalResources: number, cfg: GameConfig) => worker.sendResponse(WadWorkerMessage.createCfgLoaded(cfg, totalResources))
        wadLoader.onAssetLoaded = (assetIndex: number, assetNames: string[], assetObj: any, sfxKeys: string[]) => {
            worker.sendResponse(WadWorkerMessage.createAssetLoaded(assetIndex, assetNames, assetObj, sfxKeys))
        }
        wadLoader.onLoadDone = (totalResources: number) => {
            worker.sendResponse(WadWorkerMessage.createLoadDone(totalResources))
        }
        wadLoader.onDownloadProgress = (wadFileIndex: number, loadedBytes: number, totalBytes: number) => {
            worker.sendResponse(WadWorkerMessage.createDownloadProgress(wadFileIndex, loadedBytes, totalBytes))
        }
        worker.onMessageFromFrontend = (msg) => {
            // start loading
            if (msg) {
                wadLoader.loadWadFiles(msg.wad0FileUrl, msg.wad1FileUrl)
            } else {
                wadLoader.startWithCachedFiles()
            }
        }
    }
}

const worker: Worker = self as any
new WadWorker(new TypedWorkerThreaded(worker))
