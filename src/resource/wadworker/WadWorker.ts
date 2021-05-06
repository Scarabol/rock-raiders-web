import { InitLoadingMessage } from './InitLoadingMessage'
import { WadLoader } from './WadLoader'
import { WadWorkerMessage } from './WadWorkerMessage'
import { WorkerMessageType } from './WorkerMessageType'

const worker: Worker = self as any

function postMessage(assetMessage: WadWorkerMessage) {
    worker.postMessage(assetMessage)
}

worker.addEventListener('message', (event) => {
    const wadLoader = new WadLoader()
    // set callbacks on wadLoader
    wadLoader.onMessage = (text: string) => postMessage(WadWorkerMessage.createTextMessage(text))
    wadLoader.onInitialLoad = (totalResources: number, cfg: any) => postMessage(WadWorkerMessage.createCfgLoaded(cfg, totalResources))
    wadLoader.onAssetLoaded = (assetIndex: number, assetNames: string[], assetObj: any) => {
        postMessage(WadWorkerMessage.createAssetLoaded(assetIndex, assetNames, assetObj))
    }
    wadLoader.onLoadDone = (totalResources: number, loadingTimeSeconds: string) => {
        postMessage(WadWorkerMessage.createLoadDone(totalResources, loadingTimeSeconds))
    }
    // start loading
    const msg = event.data as InitLoadingMessage
    if (msg) {
        wadLoader.loadWadFiles(msg.wad0FileUrl, msg.wad1FileUrl)
    } else {
        wadLoader.startWithCachedFiles(() => postMessage(new WadWorkerMessage(WorkerMessageType.CACHE_MISS)))
    }
})
