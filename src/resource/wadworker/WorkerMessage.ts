export class WorkerMessage {

    type: WorkerMessageType = null
    text?: string
    cfg?: any
    totalResources?: number
    assetName?: string
    assetObj?: any
    assetIndex?: number
    loadingTimeSeconds?: string

    constructor(type: WorkerMessageType) {
        this.type = type
    }

    static createTextMessage(msg: string): WorkerMessage {
        return {type: WorkerMessageType.MSG, text: msg}
    }

    static createCfgLoaded(cfg: any, totalResources: number): WorkerMessage {
        return {type: WorkerMessageType.CFG, cfg: cfg, totalResources: totalResources}
    }

    static createAssetLoaded(assetIndex: number, assetName: string, assetObj: any) {
        return {type: WorkerMessageType.ASSET, assetIndex: assetIndex, assetName: assetName, assetObj: assetObj}
    }

    static createLoadDone(totalResources: number, loadingTimeSeconds: string) {
        return {type: WorkerMessageType.DONE, totalResources: totalResources, loadingTimeSeconds: loadingTimeSeconds}
    }

}

export enum WorkerMessageType {

    MSG,
    CFG,
    CACHE_MISS,
    SFX,
    ASSET,
    DONE,

}
