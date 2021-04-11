import { InitLoadingMessage } from './InitLoadingMessage'
import { WadLoader } from './WadLoader'
import { WorkerMessage, WorkerMessageType } from './WorkerMessage'

const resourceWorker: Worker = self as any

function postMessage(assetMessage: WorkerMessage) {
    resourceWorker.postMessage(assetMessage)
}

resourceWorker.addEventListener('message', (event) => {
    const wadLoader = new WadLoader()
    // set callbacks on wadLoader
    wadLoader.onMessage = (text: string) => postMessage(WorkerMessage.createTextMessage(text))
    wadLoader.onInitialLoad = (totalResources: number, cfg: any) => postMessage(WorkerMessage.createCfgLoaded(cfg, totalResources))
    wadLoader.onAssetLoaded = (assetIndex: number, assetName: string, assetObj: any) => {
        postMessage(WorkerMessage.createAssetLoaded(assetIndex, assetName, assetObj))
    }
    wadLoader.onLoadDone = (totalResources: number, loadingTimeSeconds: string) => {
        postMessage(WorkerMessage.createLoadDone(totalResources, loadingTimeSeconds))
    }
    // start loading
    const msg = event.data as InitLoadingMessage
    if (msg) {
        wadLoader.loadWadFiles(msg.wad0FileUrl, msg.wad1FileUrl)
    } else {
        wadLoader.startWithCachedFiles(() => postMessage(new WorkerMessage(WorkerMessageType.CACHE_MISS)))
    }
})
