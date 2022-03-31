import { GameConfig } from '../../cfg/GameConfig'
import { TypedWorkerBackend } from '../../worker/TypedWorker'
import { InitLoadingMessage } from './InitLoadingMessage'
import { WadLoader } from './WadLoader'
import { WadWorkerMessage } from './WadWorkerMessage'

export class WadSystem {
    constructor(worker: TypedWorkerBackend<InitLoadingMessage>) {
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
