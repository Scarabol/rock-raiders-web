import { GameConfig } from '../../cfg/GameConfig'
import { BitmapFontData } from '../../core/BitmapFont'
import { getFilename, yieldToMainThread } from '../../core/Util'
import { cacheGetData, cachePutData } from '../AssetCacheHelper'
import { FlhParser } from '../FlhParser'
import { BitmapWorkerPool } from '../../worker/BitmapWorkerPool'
import { CfgFileParser } from './parser/CfgFileParser'
import { NerpMsgParser } from './parser/NerpMsgParser'
import { ObjectiveTextParser } from './parser/ObjectiveTextParser'
import { WadParser } from './parser/WadParser'
import { WadAssetRegistry } from './WadAssetRegistry'
import { WadFile } from './WadFile'
import { grayscaleToGreen } from './WadUtil'
import { Cursor } from '../Cursor'
import { DEFAULT_FONT_NAME } from '../../params'

export class WadLoader {
    static readonly bitmapWorkerPool = new BitmapWorkerPool().createPool(16, null)

    wad0File: WadFile = null
    wad1File: WadFile = null
    assetIndex: number = 0
    totalResources: number = 0
    assetRegistry: WadAssetRegistry = new WadAssetRegistry(this)

    onMessage: (msg: string) => any = (msg: string) => {
        console.log(msg)
    }
    onCacheMiss: (cacheIdentifier: string) => any = (cacheIdentifier: string) => {
        console.log(`Cache missed for: ${cacheIdentifier}`)
    }
    onInitialLoad: (totalResources: number, cfg: GameConfig) => any = () => {
        console.log('Initial loading done.')
    }
    onAssetLoaded: (assetIndex: number, assetNames: string[], assetObj: any, sfxKeys?: string[]) => any = () => {
    }
    onLoadDone: (totalResources: number) => any = (totalResources: number) => {
        console.log(`Loading of about ${totalResources} assets complete!`)
    }
    onDownloadProgress: (wadFileIndex: number, loadedBytes: number, totalBytes: number) => unknown = (wadFileIndex: number, loadedBytes: number, totalBytes: number): void => {
        console.log(`Download of WAD${wadFileIndex} in progress ${Math.round(loadedBytes / totalBytes * 100)}%`)
    }

    loadWadImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name)
        WadLoader.bitmapWorkerPool.decodeBitmap(data)
            .then((imgData) => callback([name], imgData))
    }

    loadWadTexture(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name)
        const alphaIndexMatch = name.toLowerCase().match(/(.*a)(\d+)(_.+)/)
        let alphaIndex = null
        const assetNames = [name]
        if (alphaIndexMatch) {
            assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
            alphaIndex = parseInt(alphaIndexMatch[2])
        }
        WadLoader.bitmapWorkerPool.decodeBitmapWithAlphaIndex(data, alphaIndex)
            .then((imgData) => {
                if (name.toLowerCase().startsWith('miscanims/crystal')) { // XXX fix crystal lwo loading
                    callback(assetNames, grayscaleToGreen(imgData))
                } else {
                    callback(assetNames, imgData)
                }
            })
    }

    loadAlphaImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name)
        WadLoader.bitmapWorkerPool.decodeBitmapWithAlpha(data)
            .then((imgData) => {
                const assetNames = [name]
                const alphaIndexMatch = name.toLowerCase().match(/(.*a)(\d+)(_.+)/)
                if (alphaIndexMatch) assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
                callback(assetNames, imgData)
            })
    }

    loadFontImageAsset(name: string, callback: (assetNames: string[], obj: BitmapFontData) => any) {
        const data = this.wad0File.getEntryData(name)
        WadLoader.bitmapWorkerPool.decodeBitmap(data)
            .then((imgData) => {
                const cols = 10, rows = 19 // font images mostly consist of 10 columns and 19 rows with last row empty
                // XXX find better way to detect char dimensions
                const maxCharWidth = imgData.width / cols
                const charHeight = imgData.height / rows
                const bitmapFontData = new BitmapFontData(imgData, maxCharWidth, charHeight)
                callback([name], bitmapFontData)
            })
    }

    loadNerpAsset(name: string, callback: (assetNames: string[], obj: string) => any) {
        const nrnName = name.replace(/\.npl$/, '.nrn')
        const script = this.wad0File.getEntryText(nrnName)
        callback([name, nrnName], script)
    }

    loadNerpMsg(name: string, callback: (assetNames: string[], obj: any) => any) {
        const wad0Data = this.wad0File.getEntryText(name)
        const wad1Data = this.wad1File.getEntryText(name)
        const result = NerpMsgParser.parseNerpMessages(wad0Data, wad1Data)
        callback([name], result)
    }

    loadObjectiveTexts(name: string, callback: (assetNames: string[], obj: any) => any) {
        const txtContent = this.wad1File.getEntryData(name)
        const result = new ObjectiveTextParser().parseObjectiveTextFile(txtContent)
        callback([name], result)
    }

    loadMapAsset(name: string, callback: (assetNames: string[], obj: any) => any) {
        const buffer = this.wad0File.getEntryData(name)
        if (buffer.length < 13 || String.fromCharCode.apply(String, buffer.slice(0, 3)) !== 'MAP') {
            console.error(`Invalid map data provided for: ${name}`)
            return
        }
        const map = WadParser.parseMap(buffer)
        callback([name], map)
    }

    loadObjectListAsset(name: string, callback: (assetNames: string[], obj: any) => any) {
        const data = this.wad0File.getEntryText(name)
        const objectList = WadParser.parseObjectList(data)
        callback([name], objectList)
    }

    /**
     * Load a WAV file format sound asset from the WAD file.
     * @param path Path inside the WAD file
     * @param callback A callback that is triggered after the file has been loaded
     */
    loadWavAsset(path: string, callback: (assetNames: string[], obj: any) => any) {
        let buffer: ArrayBufferLike
        try { // localized wad1 file first, then generic wad0 file
            buffer = this.wad1File.getEntryBuffer(path)
        } catch (e) {
            buffer = this.wad0File.getEntryBuffer(path)
        }
        callback([path], buffer)
    }

    loadLWOFile(lwoFilepath: string, callback: (assetNames: string[], obj: any) => any) {
        let lwoContent = null
        try {
            lwoContent = this.wad0File.getEntryBuffer(lwoFilepath)
        } catch (e) {
            try {
                lwoContent = this.wad0File.getEntryBuffer(`world/shared/${getFilename(lwoFilepath)}`)
            } catch (e) {
                if (!lwoFilepath.equalsIgnoreCase('Vehicles/BullDozer/VLBD_light.lwo') // ignore known issues
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_bucket.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_main.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_C_Pit.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_Light01.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/digbodlight.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_PipeL.lwo')) {
                    console.error(`Could not load LWO file ${lwoFilepath}; Error: ${e}`)
                }
            }
        }
        callback([lwoFilepath], lwoContent)
    }

    loadFlhAsset(filename: string, callback: (assetNames: string[], obj: any) => any) {
        const flhContent = this.wad0File.getEntryBuffer(filename)
        const flhFrames = new FlhParser().parse(flhContent)
        callback([filename], flhFrames)
    }

    loadAssetsParallel() {
        const promises: Promise<void>[] = []
        const that = this
        this.assetRegistry.forEach((asset) => {
            promises.push(new Promise<void>((resolve) => {
                setTimeout(() => {
                    try {
                        asset.method(asset.assetPath, (assetNames, assetObj) => {
                            this.assetIndex++
                            that.onAssetLoaded(this.assetIndex, assetNames, assetObj, asset.sfxKeys)
                            resolve()
                        })
                    } catch (e) {
                        if (!asset.optional) console.error(e)
                        this.assetIndex++
                        that.onAssetLoaded(this.assetIndex, [asset.assetPath], null, asset.sfxKeys)
                        resolve()
                    }
                })
            }))
        })
        Promise.all(promises).then(() => this.onLoadDone(this.totalResources))
    }

    startWithCachedFiles() {
        console.time('WAD files loaded from cache')
        this.onMessage('Loading WAD files from cache...')
        Promise.all<ArrayBuffer>([
            cacheGetData('wad0Buffer'),
            cacheGetData('wad1Buffer'),
        ]).then(async (wadFileBuffer) => {
            if (wadFileBuffer && wadFileBuffer[0] && wadFileBuffer[1]) {
                await yieldToMainThread()
                console.timeEnd('WAD files loaded from cache')
                this.startLoadingProcess(wadFileBuffer).then()
            } else {
                this.onMessage('WAD files not found in cache')
                this.onCacheMiss('WAD file buffers')
            }
        }).catch((e: Error) => {
            console.error(e)
            this.onMessage('Could not read WAD file buffer from cache')
            this.onCacheMiss(e.message) // Firefox 98 is not able to transfer Error
        })
    }

    loadWadFiles(wad0Url: string, wad1Url: string) {
        Promise.all<ArrayBuffer>([
            this.loadWadFile(0, wad0Url),
            this.loadWadFile(1, wad1Url),
        ]).then((wadFileBuffer) => {
            cachePutData('wad0Buffer', wadFileBuffer[0]).then()
            cachePutData('wad1Buffer', wadFileBuffer[1]).then()
            this.startLoadingProcess(wadFileBuffer).then()
        })
    }

    loadWadFile(wadFileIndex: number, url: string) {
        return new Promise<ArrayBuffer>(resolve => {
            console.log(`Loading WAD file from ${url}`)
            const xhr = new XMLHttpRequest()
            xhr.open('GET', url)
            xhr.responseType = 'arraybuffer'
            xhr.onprogress = (event) => this.onDownloadProgress(wadFileIndex, event.loaded, event.total)
            xhr.onerror = (event) => console.error(event)
            xhr.onload = (event) => resolve(xhr.response)
            xhr.send()
        })
    }

    async startLoadingProcess(wadFileBuffer: ArrayBuffer[]) {
        this.wad0File = WadFile.parseWadFile(wadFileBuffer[0])
        this.wad1File = WadFile.parseWadFile(wadFileBuffer[1])
        this.onMessage('Loading configuration...')
        const cfgFiles = this.wad1File.filterEntryNames('\\.cfg')
        if (cfgFiles.length < 1) throw new Error('Invalid second WAD file given! No config file present at root level.')
        if (cfgFiles.length > 1) console.warn(`Found multiple config files ${cfgFiles} will proceed with first one ${cfgFiles[0]} only`)
        await yieldToMainThread()
        const cfg = await CfgFileParser.parse(this.wad1File.getEntryData(cfgFiles[0]))
        await yieldToMainThread()
        await this.assetRegistry.registerAllAssets(cfg) // dynamically register all assets from config
        this.onMessage('Loading initial assets...')
        await Promise.all([
            new Promise<void>((resolve) => {
                const name = cfg.main.loadScreen // loading screen image
                this.loadWadImageAsset(name, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
            new Promise<void>((resolve) => {
                const name = cfg.main.progressBar // loading bar container image
                this.loadWadImageAsset(name, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
            new Promise<void>((resolve) => {
                const name = cfg.pointers.get(Cursor.STANDARD) as string
                this.loadAlphaImageAsset(name, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
            new Promise<void>((resolve) => {
                this.loadFontImageAsset(DEFAULT_FONT_NAME, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
        ])
        await yieldToMainThread()
        this.onMessage('Start loading assets...')
        this.totalResources = this.assetRegistry.size
        this.onInitialLoad(this.totalResources, cfg)
        this.assetIndex = 0
        this.loadAssetsParallel()
    }
}
