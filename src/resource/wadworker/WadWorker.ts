import { InitLoadingMessage } from './InitLoadingMessage'
import { WadLoader } from './WadLoader'
import { WadWorkerMessage } from './WadWorkerMessage'

const worker: Worker = self as any

function postMessage(assetMessage: WadWorkerMessage) {
    worker.postMessage(assetMessage)
}

worker.addEventListener('message', (event) => {
    const wadLoader = new WadLoader()
    // set callbacks on wadLoader
    wadLoader.onMessage = (text: string) => postMessage(WadWorkerMessage.createTextMessage(text))
    wadLoader.onCacheMiss = (cacheIdentifier: string) => postMessage(WadWorkerMessage.createCacheMissed(cacheIdentifier))
    wadLoader.onInitialLoad = (totalResources: number, cfg: any) => postMessage(WadWorkerMessage.createCfgLoaded(cfg, totalResources))
    wadLoader.onAssetLoaded = (assetIndex: number, assetNames: string[], assetObj: any, sfxKeys: string[]) => {
        postMessage(WadWorkerMessage.createAssetLoaded(assetIndex, assetNames, assetObj, sfxKeys))
    }
    wadLoader.onLoadDone = (totalResources: number, loadingTimeSeconds: string) => {
        postMessage(WadWorkerMessage.createLoadDone(totalResources, loadingTimeSeconds))
    }
    // start loading
    const msg = event.data as InitLoadingMessage
    if (msg) {
        wadLoader.loadWadFiles(msg.wad0FileUrl, msg.wad1FileUrl)
    } else {
        wadLoader.startWithCachedFiles()
    }
})
