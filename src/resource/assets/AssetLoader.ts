import { getFilename, getPath, iGet } from '../../core/Util'
import { ResourceManager } from '../ResourceManager'
import { cachePutData } from './AssetCacheHelper'
import { AssetEntry, AssetsContainer, LoadingStage } from './AssetsContainer'
import { AssetType, AssetWorkerMessageType, AssetWorkerRequestMessage, AssetWorkerResponseMessage } from './AssetWorker'

export class AssetsLoadProcess {

    worker: Worker = new Worker(new URL('./AssetWorker', import.meta.url))
    openRequests: Map<string, { onSuccess: () => any, onError: (error: any) => any }> = new Map()
    assets: AssetsContainer = null
    wad0EntryIndexByName: Map<string, number> = null
    wad1EntryIndexByName: Map<string, number> = null

    constructor(assets: AssetsContainer) {
        this.worker.addEventListener('message', (e) => {
            const msg = e.data as AssetWorkerResponseMessage
            switch (msg.type) {
                case AssetWorkerMessageType.OK:
                    this.onAssetLoaded(msg.assetEntry, msg.data)
                    break
                case AssetWorkerMessageType.ERROR:
                    this.onLoadError(msg.assetEntry, msg.data)
                    break
                default:
                    console.error('Unexpected asset worker response message type: ' + AssetWorkerResponseMessage[msg.type] + ' (' + msg.type + ')')
                    break
            }
        })
        this.assets = assets
    }

    onAssetLoaded(assetEntry: AssetEntry, data: any) {
        if (assetEntry.assetType === AssetType.CURSOR) {
            const cursorImage = document.createElement('canvas')
            cursorImage.setAttribute('width', data.width.toString())
            cursorImage.setAttribute('height', data.height.toString())
            cursorImage.getContext('2d').putImageData(data, 0, 0)
            data = ['url(' + cursorImage.toDataURL() + '), auto']
        } else if (assetEntry.assetType === AssetType.LWS) {
            const lwoFiles: string[] = this.extractLwoFiles(getPath(assetEntry.filepath), data)
            lwoFiles.forEach((lwoFile) => this.assets.addAsset(AssetType.LWO, lwoFile, {stage: LoadingStage.SECONDARY}))
        } else if (assetEntry.assetType === AssetType.AE_FILE) {
            const path = getPath(assetEntry.filepath)
            // load all textures for this type
            this.assets.addTextureFolder(path)
            const wheelMeshName = iGet(data, 'WheelMesh')
            if (wheelMeshName && !'NULL_OBJECT'.equalsIgnoreCase(wheelMeshName)) {
                this.assets.addAsset(AssetType.LWO, path + wheelMeshName + '.lwo')
            }
            ['HighPoly', 'MediumPoly', 'LowPoly'].forEach((polyType) => { // TODO add 'FPPoly' (contains two cameras)
                const cfgPoly = iGet(data, polyType)
                if (cfgPoly) {
                    Object.keys(cfgPoly).forEach((key) => {
                        this.assets.addAsset(AssetType.LWO, path + cfgPoly[key] + '.lwo')
                    })
                }
            })
            Object.keys(data).forEach((cfgKey) => {
                const value = data[cfgKey]
                const isLws = iGet(value, 'LWSFILE') === true
                if (isLws) {
                    const file = iGet(value, 'FILE')
                    this.assets.addLWSFile(path + file + '.lws')
                }
            })
        }
        switch (assetEntry.assetType) {
            case AssetType.CONFIG_MAIN:
                ResourceManager.configuration = data
                break
            case AssetType.WAD0_FILE_CACHE:
            case AssetType.WAD0_FILE_URL:
                this.wad0EntryIndexByName = data
                break
            case AssetType.WAD1_FILE_CACHE:
            case AssetType.WAD1_FILE_URL:
                this.wad1EntryIndexByName = data
                break
            default:
                assetEntry.assetNames.forEach((name) => {
                    if (!assetEntry.loadedFromCache) {
                        // caching must happen here to make main thread post processing for cursors possible
                        cachePutData(name, data).then()
                    }
                    ResourceManager.resourceByName.set(name.toLowerCase(), data)
                })
                break
        }
        this.openRequests.get(assetEntry.cacheIdentifier)?.onSuccess()
        AssetLoader.onAssetLoaded()
    }

    extractLwoFiles(path: string, content: string): string[] {
        const lines: string[] = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n') // normalize newlines
            .replace(/\t/g, ' ') // tabs to spaces
            .split('\n')
            .map((l) => l.trim())

        if (lines[0] !== 'LWSC') {
            throw new Error('Invalid start of file! Expected \'LWSC\' in first line')
        }

        return lines.filter((line) => line.toLowerCase().startsWith('LoadObject '.toLowerCase()))
            .map((objLine) => path + getFilename(objLine.substring('LoadObject '.length)).toLowerCase())
    }

    onLoadError(assetEntry: AssetEntry, error: any) {
        this.openRequests.get(assetEntry.cacheIdentifier)?.onError(error)
    }

    async loadAllAssets() {
        const startTime = new Date()
        await this.loadAssetsForStage(LoadingStage.FILE)
        console.log('Asset files loaded after ' + ((new Date().getTime() - startTime.getTime()) / 1000) + ' seconds')
        await this.loadAssetsForStage(LoadingStage.CFG)
        this.assets.addAssetsFromConfiguration(ResourceManager.configuration, this.wad0EntryIndexByName, this.wad1EntryIndexByName)
        await this.loadAssetsForStage(LoadingStage.INIT)
        AssetLoader.onInitialLoad(this.assets.numOfAssets)
        await this.loadAssetsForStage(LoadingStage.PRIMARY)
        await this.loadAssetsForStage(LoadingStage.SECONDARY)
        // indicate that loading is complete, and display the total loading time
        const loadingTimeSeconds = ((new Date().getTime() - startTime.getTime()) / 1000).toFixed(3).toString()
        console.log('Loading of about ' + this.assets.numOfAssets + ' assets complete! Total load time: ' + loadingTimeSeconds + ' seconds.')
    }

    private async loadAssetsForStage(stage: LoadingStage) {
        return await Promise.all(
            this.assets.get(stage).map((a) => this.loadAssetFromWorker(a)),
        ).then(() => {
        }).catch((e) => {
            throw e
        })
    }

    private async loadAssetFromWorker(assetEntry: AssetEntry) {
        if (this.openRequests.has(assetEntry.cacheIdentifier)) {
            // console.log('Asset already requested: ' + identifier)
            return
        }
        this.worker.postMessage(new AssetWorkerRequestMessage(assetEntry))
        return new Promise<void>((resolve, reject) => {
            this.openRequests.set(assetEntry.cacheIdentifier, {onSuccess: resolve, onError: reject})
        })
    }

}

export class AssetLoader {

    static startLoadingFromCache() {
        this.onMessage('Loading asset files from cache...')
        const wad0AssetEntry = new AssetEntry(AssetType.WAD0_FILE_CACHE, 'wad0')
        const wad1AssetEntry = new AssetEntry(AssetType.WAD1_FILE_CACHE, 'wad1')
        this.startLoadingProcess(wad0AssetEntry, wad1AssetEntry).catch((e) => {
            console.error('Error while loading assets from cache: ', e)
            this.onCacheError()
        }).then(() => {
            this.onLoadDone()
        })
    }

    static startLoadingFromUrl(wad0Url: string, wad1Url: string) {
        this.onMessage('Loading asset files from urls...')
        const wad0AssetEntry = new AssetEntry(AssetType.WAD0_FILE_URL, 'wad0', {filepath: wad0Url})
        const wad1AssetEntry = new AssetEntry(AssetType.WAD1_FILE_URL, 'wad1', {filepath: wad1Url})
        this.startLoadingProcess(wad0AssetEntry, wad1AssetEntry).then(() => {
            this.onLoadDone()
        })
    }

    private static startLoadingProcess(wad0AssetEntry: AssetEntry, wad1AssetEntry: AssetEntry) {
        const assets = new AssetsContainer(wad0AssetEntry, wad1AssetEntry)
        return new AssetsLoadProcess(assets).loadAllAssets()
    }

    static onMessage: (msg: string) => any = (msg: string) => {
        console.log(msg)
    }

    static onCacheError: () => any = () => {
        console.log('Worker missed cache')
    }

    static onInitialLoad: (totalResources: number) => any = () => {
        console.log('Initial loading done.')
    }

    static onAssetLoaded: () => any = () => {
        // logging here leads to massive spam
    }

    static onLoadDone: () => any = () => {
        console.log('Loading complete')
    }

}
