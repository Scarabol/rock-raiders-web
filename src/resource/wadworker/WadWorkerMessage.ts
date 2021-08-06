import { GameStatsCfg } from '../../cfg/GameStatsCfg'
import { WorkerMessageType } from './WorkerMessageType'

export class WadWorkerMessage {
    type: WorkerMessageType = null
    text?: string
    cfg?: any
    stats?: any
    totalResources?: number
    assetNames?: string[]
    assetObj?: any
    sfxKeys?: string[]

    constructor(type: WorkerMessageType) {
        this.type = type
    }

    static createTextMessage(msg: string): WadWorkerMessage {
        return {type: WorkerMessageType.MSG, text: msg}
    }

    static createCfgLoaded(cfg: any, totalResources: number): WadWorkerMessage {
        return {
            type: WorkerMessageType.CFG,
            cfg: cfg,
            stats: new GameStatsCfg().setFromCfgObj(cfg['Stats']),
            totalResources: totalResources,
        }
    }

    static createAssetLoaded(assetIndex: number, assetNames: string[], assetObj: any, sfxKeys: string[]): WadWorkerMessage {
        return {type: WorkerMessageType.ASSET, assetNames: assetNames, assetObj: assetObj, sfxKeys: sfxKeys}
    }

    static createLoadDone(totalResources: number): WadWorkerMessage {
        return {type: WorkerMessageType.DONE, totalResources: totalResources}
    }

    static createCacheMissed(cacheIdentifier: string) {
        return {type: WorkerMessageType.CACHE_MISS, cacheIdentifier: cacheIdentifier}
    }
}
