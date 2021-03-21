import { InitLoadingMessage } from './InitLoadingMessage';
import { WadLoader } from './WadLoader';

const resourceWorker: Worker = self as any;

resourceWorker.addEventListener('message', (event) => {
    const wadLoader = new WadLoader();
    // set callbacks on wadLoader
    wadLoader.onMessage = (msg: string) => {
        resourceWorker.postMessage({msg: msg});
    };
    wadLoader.onInitialLoad = (totalResources: number, cfg: any) => {
        resourceWorker.postMessage({totalResources: totalResources, cfg: cfg});
    };
    wadLoader.onAssetLoaded = (assetIndex: number, assetName: string, assetObj: any) => {
        resourceWorker.postMessage({assetIndex: assetIndex, assetName: assetName, assetObj: assetObj});
    };
    wadLoader.onLoadDone = (totalResources: number, loadingTimeSeconds: string) => {
        resourceWorker.postMessage({
            done: true,
            totalResources: totalResources,
            loadingTimeSeconds: loadingTimeSeconds
        });
    };
    // start loading
    const msg = event.data as InitLoadingMessage;
    if (msg) {
        wadLoader.loadWadFiles(msg.wad0FileUrl, msg.wad1FileUrl);
    } else {
        wadLoader.startWithCachedFiles(() => {
            resourceWorker.postMessage({cacheMissed: true});
        });
    }
});
