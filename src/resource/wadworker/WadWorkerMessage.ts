import { GameConfig } from '../../cfg/GameConfig'
import { WorkerMessageType } from './WorkerMessageType'

export class WadWorkerMessage {
    type: WorkerMessageType = null
    text?: string
    cfg?: GameConfig
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

    static createCfgLoaded(cfg: GameConfig, totalResources: number): WadWorkerMessage {
        return {
            type: WorkerMessageType.CFG,
            cfg: cfg,
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
