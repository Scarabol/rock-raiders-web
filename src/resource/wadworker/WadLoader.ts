import { getFilename, iGet } from '../../core/Util'
import { cacheGetData, cachePutData } from '../assets/AssetCacheHelper'
import { FlhParser } from '../FlhParser'
import { BitmapWithPalette } from './parser/BitmapWithPalette'
import { CfgFileParser } from './parser/CfgFileParser'
import { NerpMsgParser } from './parser/NerpMsgParser'
import { ObjectiveTextParser } from './parser/ObjectiveTextParser'
import { WadParser } from './parser/WadParser'
import { WadAssetRegistry } from './WadAssetRegistry'
import { WadFile } from './WadFile'
import { grayscaleToGreen } from './WadUtil'

export class WadLoader {

    wad0File: WadFile = null
    wad1File: WadFile = null
    assetIndex: number = 0
    totalResources: number = 0
    assetRegistry: WadAssetRegistry = new WadAssetRegistry(this)

    onMessage: (msg: string) => any = (msg: string) => {
        console.log(msg)
    }
    onCacheMiss: (cacheIdentifier: string) => any = (cacheIdentifier: string) => {
        console.log('Cache missed for: ' + cacheIdentifier)
    }
    onInitialLoad: (totalResources: number, cfg: any) => any = () => {
        console.log('Initial loading done.')
    }
    onAssetLoaded: (assetIndex: number, assetNames: string[], assetObj: any, sfxKeys?: string[]) => any = () => {
    }
    onLoadDone: (totalResources: number) => any = (totalResources: number) => {
        console.log('Loading of about ' + totalResources + ' assets complete!')
    }

    loadWadImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name)
        const imgData = BitmapWithPalette.decode(data)
        callback([name], imgData)
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
        const imgData = BitmapWithPalette.decode(data).applyAlphaByIndex(alphaIndex)
        if (name.toLowerCase().startsWith('miscanims/crystal')) { // XXX fix crystal lwo loading
            callback(assetNames, grayscaleToGreen(imgData))
        } else {
            callback(assetNames, imgData)
        }
    }

    loadAlphaImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name)
        const imgData = BitmapWithPalette.decode(data).applyAlpha()
        const assetNames = [name]
        const alphaIndexMatch = name.toLowerCase().match(/(.*a)(\d+)(_.+)/)
        if (alphaIndexMatch) assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
        callback(assetNames, imgData)
    }

    loadFontImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryData(name)
        const imgData = BitmapWithPalette.decode(data)
        callback([name], imgData)
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
            console.error('Invalid map data provided for: ' + name)
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
        let lwoContent
        try {
            lwoContent = this.wad0File.getEntryBuffer(lwoFilepath)
        } catch (e) {
            try {
                lwoContent = this.wad0File.getEntryBuffer('world/shared/' + getFilename(lwoFilepath))
            } catch (e) {
                if (!lwoFilepath.equalsIgnoreCase('Vehicles/BullDozer/VLBD_light.lwo') // ignore known issues
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_bucket.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_main.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_C_Pit.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_Light01.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/digbodlight.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_PipeL.lwo')) {
                    console.error('Could not load LWO file ' + lwoFilepath + '; Error: ' + e)
                }
                lwoContent = {}
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
        const promises = []
        const that = this
        this.assetRegistry.forEach((asset) => {
            promises.push(new Promise<void>((resolve) => {
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
            }))
        })
        Promise.all(promises).then(() => this.onLoadDone(this.totalResources))
    }

    startWithCachedFiles() {
        console.time('WAD files loaded from cache')
        this.onMessage('Loading WAD files from cache...')
        Promise.all<WadFile>([
            cacheGetData('wad0'),
            cacheGetData('wad1'),
        ]).then((wadData) => {
            this.wad0File = WadLoader.createWadFile(wadData[0])
            this.wad1File = WadLoader.createWadFile(wadData[1])
            console.timeEnd('WAD files loaded from cache')
            this.startLoadingProcess()
        }).catch((e) => {
            console.error(e)
            this.onMessage('WAD file not found in cache')
            this.onCacheMiss(e)
        })
    }

    private static createWadFile(wadData: WadFile) {
        const wadFile = new WadFile()
        for (let prop in wadData) { // class info are runtime info and not stored in cache => use copy constructor
            if (wadData.hasOwnProperty(prop)) {
                wadFile[prop] = wadData[prop]
            }
        }
        return wadFile
    }

    /**
     * Private helper method, which combines file loading and waits for them to become ready before continuing
     * @param wad0Url Url to parse the LegoRR0.wad file from
     * @param wad1Url Url to parse the LegoRR1.wad file from
     */
    loadWadFiles(wad0Url: string, wad1Url: string) {
        Promise.all<WadFile>([
            this.loadWadFile(wad0Url),
            this.loadWadFile(wad1Url),
        ]).then((wadFiles) => {
            this.wad0File = wadFiles[0]
            this.wad1File = wadFiles[1]
            cachePutData('wad0', this.wad0File).then()
            cachePutData('wad1', this.wad1File).then()
            this.startLoadingProcess()
        })
    }

    /**
     * Read WAD file as binary blob from the given URL and parse it on success
     * @param url the url to the WAD file, can be local file url (file://...) too
     */
    loadWadFile(url: string) {
        return new Promise<WadFile>(resolve => {
            console.log('Loading WAD file from ' + url)
            fetch(url).then((response) => {
                if (response.ok) {
                    response.arrayBuffer().then((buffer) => {
                        const wadFile = new WadFile()
                        wadFile.parseWadFile(buffer)
                        resolve(wadFile)
                    })
                }
            }).catch((e) => console.error(e))
        })
    }

    /**
     * Load essential files, to begin the chain of asset loading
     */
    startLoadingProcess() {
        this.onMessage('Loading configuration...')
        const cfg = CfgFileParser.parse(this.wad1File.getEntryData('Lego.cfg'))
        // dynamically register all assets from config
        this.assetRegistry.registerAllAssets(cfg)
        this.onMessage('Loading initial assets...')
        Promise.all([
            new Promise<void>((resolve) => {
                const name = iGet(cfg, 'Main', 'LoadScreen') // loading screen image
                this.loadWadImageAsset(name, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
            new Promise<void>((resolve) => {
                const name = iGet(cfg, 'Main', 'ProgressBar') // loading bar container image
                this.loadWadImageAsset(name, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
            new Promise<void>((resolve) => {
                const name = iGet(cfg, 'Pointers', 'Pointer_Standard')
                this.loadAlphaImageAsset(name, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
            new Promise<void>((resolve) => {
                const name = 'Interface/Fonts/Font5_Hi.bmp'
                this.loadFontImageAsset(name, (assetNames: string[], imgData) => {
                    this.onAssetLoaded(0, assetNames, imgData)
                    resolve()
                })
            }),
        ]).then(() => {
            this.onMessage('Start loading assets...')
            this.totalResources = this.assetRegistry.size
            this.onInitialLoad(this.totalResources, cfg)
            this.assetIndex = 0
            this.loadAssetsParallel()
        })
    }

}
