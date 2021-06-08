import { getFilename, iGet } from '../../core/Util'
import { FlhParser } from '../FlhParser'
import { cacheGetData, cachePutData } from './AssetCacheHelper'
import { AssetEntry } from './AssetsContainer'
import { BitmapWithPalette } from './parser/BitmapWithPalette'
import { CfgFileParser } from './parser/CfgFileParser'
import { NerpMsgParser } from './parser/NerpMsgParser'
import { ObjectiveTextParser } from './parser/ObjectiveTextParser'
import { RonFileParser } from './parser/RonFileParser'
import { WadParser } from './parser/WadParser'
import { WadFile } from './WadFile'

export enum AssetType {

    WAD0_FILE_CACHE,
    WAD0_FILE_URL,
    WAD1_FILE_CACHE,
    WAD1_FILE_URL,

    CONFIG_MAIN,
    IMAGE,
    CURSOR,
    TEXTURE,
    ALPHA_IMAGE,
    BITMAP_FONT_IMAGE,
    NERP_SCRIPT,
    NERP_MSG,
    OBJECTIVE_TEXT,
    MAP_ASSET,
    OBJECT_LIST,
    WAV,
    AE_FILE,
    LWS,
    LWO,
    FLH_ANIMATION,

}

export enum AssetWorkerMessageType {

    // requests
    LOAD,

    // responses
    OK,
    ERROR,

}

export class AssetWorkerRequestMessage {

    type: AssetWorkerMessageType
    assetEntry: AssetEntry

    constructor(assetEntry: AssetEntry) {
        this.type = AssetWorkerMessageType.LOAD
        this.assetEntry = assetEntry
    }

}

export class AssetWorkerResponseMessage {

    type: AssetWorkerMessageType
    assetEntry: AssetEntry
    data?: any

    constructor(type: AssetWorkerMessageType, assetEntry: AssetEntry, data: any) {
        this.type = type
        this.assetEntry = assetEntry
        this.data = data
    }

}

type CallbackAssetLoaded = (assetEntry: AssetEntry, data: any) => any
type CallbackAssetError = (assetEntry: AssetEntry, error: any) => any

export class AssetWorker {

    onAssetLoaded: CallbackAssetLoaded = null
    onAssetError: CallbackAssetError = null
    wad0File: WadFile = null
    wad1File: WadFile = null

    constructor(onAssetLoaded: CallbackAssetLoaded, onAssetError: CallbackAssetError) {
        this.onAssetLoaded = onAssetLoaded
        this.onAssetError = onAssetError
    }

    processMessage(msg: AssetWorkerRequestMessage) {
        if (msg.type as any === 'webpackOk' || msg.type as any === 'webpackErrors' || msg.type as any === 'webpackInvalid') return // TODO what is this?!
        switch (msg.type) {
            case AssetWorkerMessageType.LOAD:
                this.loadAsset(msg.assetEntry)
                break
            default:
                console.error('Unexpected asset worker request message type: ' + AssetWorkerMessageType[msg.type] + ' (' + msg.type + ')')
                break
        }
    }

    loadAsset(assetEntry: AssetEntry) {
        switch (assetEntry.assetType) {
            case AssetType.WAD0_FILE_CACHE:
                this.loadFileFromCache(assetEntry)
                break
            case AssetType.WAD0_FILE_URL:
                this.loadFileFromUrl(assetEntry)
                break
            case AssetType.WAD1_FILE_CACHE:
                this.loadFileFromCache(assetEntry)
                break
            case AssetType.WAD1_FILE_URL:
                this.loadFileFromUrl(assetEntry)
                break
            case AssetType.CONFIG_MAIN:
                this.loadMainConfig(assetEntry)
                break
            case AssetType.IMAGE:
            case AssetType.CURSOR:
                this.loadWadImage(assetEntry)
                break
            case AssetType.TEXTURE:
                this.loadWadTexture(assetEntry)
                break
            case AssetType.ALPHA_IMAGE:
                this.loadAlphaImage(assetEntry)
                break
            case AssetType.BITMAP_FONT_IMAGE:
                this.loadBitmapFontImage(assetEntry)
                break
            case AssetType.NERP_SCRIPT:
                this.loadNerp(assetEntry)
                break
            case AssetType.NERP_MSG:
                this.loadNerpMsg(assetEntry)
                break
            case AssetType.OBJECTIVE_TEXT:
                this.loadObjectiveTexts(assetEntry)
                break
            case AssetType.MAP_ASSET:
                this.loadMap(assetEntry)
                break
            case AssetType.OBJECT_LIST:
                this.loadObjectList(assetEntry)
                break
            case AssetType.WAV:
                this.loadWav(assetEntry)
                break
            case AssetType.AE_FILE:
                this.loadAnimatedEntityFile(assetEntry)
                break;
            case AssetType.LWS:
                this.loadLWSFile(assetEntry)
                break
            case AssetType.LWO:
                this.loadLWOFile(assetEntry)
                break
            case AssetType.FLH_ANIMATION:
                this.loadFlh(assetEntry)
                break
            default:
                this.onAssetError(assetEntry, 'Unexpected asset type: ' + AssetType[assetEntry.assetType] + ' (' + assetEntry.assetType + ')')
                break
        }
    }

    private loadFileFromCache(assetEntry: AssetEntry) {
        cacheGetData(assetEntry.cacheIdentifier).then((data) => {
            if (!data) throw new Error('Cache miss error for identifier: ' + assetEntry.cacheIdentifier)
            this.assignFile(assetEntry, data)
        }).catch((e) => {
            this.onAssetError(assetEntry, e)
        })
    }

    private loadFileFromUrl(assetEntry: AssetEntry) {
        fetch(assetEntry.filepath).then((response) => {
            if (!response.ok) throw response
            response.arrayBuffer().then((data) => {
                this.assignFile(assetEntry, data)
            })
        }).catch((e) => this.onAssetError(assetEntry, e))
    }

    private assignFile(assetEntry: AssetEntry, file: any) {
        switch (assetEntry.assetType) {
            case AssetType.WAD0_FILE_URL:
                this.wad0File = AssetWorker.createWadFileFromUrl('wad0', file)
                this.onAssetLoaded(assetEntry, this.wad0File.entryIndexByName)
                break
            case AssetType.WAD0_FILE_CACHE:
                this.wad0File = AssetWorker.createWadFileFromCache(file)
                this.onAssetLoaded(assetEntry, this.wad0File.entryIndexByName)
                break
            case AssetType.WAD1_FILE_URL:
                this.wad1File = AssetWorker.createWadFileFromUrl('wad1', file)
                this.onAssetLoaded(assetEntry, this.wad1File.entryIndexByName)
                break
            case AssetType.WAD1_FILE_CACHE:
                this.wad1File = AssetWorker.createWadFileFromCache(file)
                this.onAssetLoaded(assetEntry, this.wad1File.entryIndexByName)
                break
            default:
                console.error('Unexpected asset type for assignment: ' + AssetType[assetEntry.assetType] + ' (' + assetEntry.assetType + ')')
                break
        }
    }

    private static createWadFileFromUrl(cacheIdentifier: string, data: any) {
        const wadFile = new WadFile()
        wadFile.parseWadFile(data)
        cachePutData(cacheIdentifier, wadFile).then()
        return wadFile
    }

    private static createWadFileFromCache(data: any) {
        const wadFile = new WadFile()
        for (let prop in data) { // classes are not stored in cache => use copy constructor
            if (data.hasOwnProperty(prop)) {
                wadFile[prop] = data[prop]
            }
        }
        return wadFile
    }

    private loadMainConfig(assetEntry: AssetEntry) {
        const data = this.wad1File.getEntryData('Lego.cfg')
        // parsing data here removes SaveButton image urls in RewardCfg on transport // XXX why?
        const cfg = CfgFileParser.parse(data)
        this.onAssetLoaded(assetEntry, cfg)
    }

    private loadWadImage(assetEntry: AssetEntry) {
        const data = this.wad0File.getEntryData(assetEntry.filepath)
        const imgData = BitmapWithPalette.decode(data)
        this.onAssetLoaded(assetEntry, imgData)
    }

    private loadWadTexture(assetEntry: AssetEntry) {
        const data = this.wad0File.getEntryData(assetEntry.filepath)
        const alphaIndexMatch = assetEntry.filepath.toLowerCase().match(/(.*a)(\d+)(_.+)/)
        let alphaIndex = null
        if (alphaIndexMatch) {
            assetEntry.assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
            alphaIndex = parseInt(alphaIndexMatch[2])
        }
        const imgData = BitmapWithPalette.decode(data).applyAlphaByIndex(alphaIndex)
        if (assetEntry.filepath.toLowerCase().startsWith('miscanims/crystal')) { // XXX fix crystal lwo loading
            this.onAssetLoaded(assetEntry, AssetWorker.grayscaleToGreen(imgData))
        } else {
            this.onAssetLoaded(assetEntry, imgData)
        }
    }

    private static grayscaleToGreen(imgData: ImageData): ImageData {
        const arr = imgData.data
        for (let c = 0; c < arr.length; c += 4) {
            arr[c] = 0
            arr[c + 2] = 0
        }
        return imgData
    }

    private loadAlphaImage(assetEntry: AssetEntry) {
        const data = this.wad0File.getEntryData(assetEntry.filepath)
        const imgData = BitmapWithPalette.decode(data).applyAlpha()
        const alphaIndexMatch = assetEntry.filepath.toLowerCase().match(/(.*a)(\d+)(_.+)/)
        if (alphaIndexMatch) assetEntry.assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
        this.onAssetLoaded(assetEntry, imgData)
    }

    private loadBitmapFontImage(assetEntry: AssetEntry) {
        const data = this.wad0File.getEntryData(assetEntry.filepath)
        const imgData = BitmapWithPalette.decode(data)
        this.onAssetLoaded(assetEntry, imgData)
    }

    private loadNerp(assetEntry: AssetEntry) {
        const nrnName = assetEntry.filepath.replace(/\.npl$/, '.nrn')
        const script = this.wad0File.getEntryText(nrnName)
        assetEntry.assetNames.push(nrnName)
        this.onAssetLoaded(assetEntry, script)
    }

    private loadNerpMsg(assetEntry: AssetEntry) {
        const wad0Data = this.wad0File.getEntryText(assetEntry.filepath)
        const wad1Data = this.wad1File.getEntryText(assetEntry.filepath)
        const result = NerpMsgParser.parseNerpMessages(wad0Data, wad1Data)
        this.onAssetLoaded(assetEntry, result)
    }

    private loadObjectiveTexts(assetEntry: AssetEntry) {
        const txtContent = this.wad1File.getEntryData(assetEntry.filepath)
        const result = new ObjectiveTextParser().parseObjectiveTextFile(txtContent)
        this.onAssetLoaded(assetEntry, result)
    }

    private loadMap(assetEntry: AssetEntry) {
        const buffer = this.wad0File.getEntryData(assetEntry.filepath)
        if (buffer.length < 13 || String.fromCharCode.apply(String, buffer.slice(0, 3)) !== 'MAP') {
            this.onAssetError(assetEntry, 'Invalid map data provided for: ' + assetEntry.filepath)
            return
        }
        const map = WadParser.parseMap(buffer)
        this.onAssetLoaded(assetEntry, map)
    }

    private loadObjectList(assetEntry: AssetEntry) {
        const data = this.wad0File.getEntryText(assetEntry.filepath)
        const objectList = WadParser.parseObjectList(data)
        this.onAssetLoaded(assetEntry, objectList)
    }

    private loadWav(assetEntry: AssetEntry) {
        let buffer: ArrayBufferLike
        try { // localized wad1 file first, then generic wad0 file
            buffer = this.wad1File.getEntryBuffer(assetEntry.filepath)
        } catch (e) {
            buffer = this.wad0File.getEntryBuffer(assetEntry.filepath)
        }
        this.onAssetLoaded(assetEntry, buffer)
    }

    private loadAnimatedEntityFile(assetEntry: AssetEntry) {
        const content = this.wad0File.getEntryText(assetEntry.filepath)
        const aeRoot = iGet(RonFileParser.parse(content), 'Lego*')
        this.onAssetLoaded(assetEntry, aeRoot)
    }

    private loadLWSFile(assetEntry: AssetEntry) {
        const content = this.wad0File.getEntryText(assetEntry.filepath)
        this.onAssetLoaded(assetEntry, content)
    }

    private loadLWOFile(assetEntry: AssetEntry) {
        let lwoContent
        try {
            lwoContent = this.wad0File.getEntryBuffer(assetEntry.filepath)
        } catch (e) {
            try {
                lwoContent = this.wad0File.getEntryBuffer('world/shared/' + getFilename(assetEntry.filepath))
            } catch (e) {
                if (!assetEntry.filepath.equalsIgnoreCase('Vehicles/BullDozer/VLBD_light.lwo') // ignore known issues
                    && !assetEntry.filepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_bucket.lwo')
                    && !assetEntry.filepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_main.lwo')
                    && !assetEntry.filepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_C_Pit.lwo')
                    && !assetEntry.filepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_Light01.lwo')
                    && !assetEntry.filepath.equalsIgnoreCase('Vehicles/LargeDigger/digbodlight.lwo')
                    && !assetEntry.filepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_PipeL.lwo')) {
                    this.onAssetError(assetEntry, 'Could not load LWO file ' + assetEntry.filepath + '; Error: ' + e)
                }
                lwoContent = {}
            }
        }
        this.onAssetLoaded(assetEntry, lwoContent)
    }

    private loadFlh(assetEntry: AssetEntry) {
        const flhContent = this.wad0File.getEntryBuffer(assetEntry.filepath)
        const flhFrames = new FlhParser().parse(flhContent)
        this.onAssetLoaded(assetEntry, flhFrames)
    }

}

const worker: Worker = self as any
const sendAssetLoadedResponse: CallbackAssetLoaded = (assetEntry: AssetEntry, data: any) => {
    worker.postMessage(new AssetWorkerResponseMessage(AssetWorkerMessageType.OK, assetEntry, data))
}
const sendAssetErrorResponse: CallbackAssetError = (assetEntry: AssetEntry, error: any) => {
    worker.postMessage(new AssetWorkerResponseMessage(AssetWorkerMessageType.ERROR, assetEntry, error))
}
const workerInstance = new AssetWorker(sendAssetLoadedResponse, sendAssetErrorResponse)
worker.addEventListener('message', (event) => workerInstance.processMessage(event.data))
