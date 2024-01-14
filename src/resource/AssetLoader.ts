import { BitmapFontData } from '../core/BitmapFont'
import { getFilename } from '../core/Util'
import { FlhParser } from './fileparser/FlhParser'
import { BitmapWorkerPool } from '../worker/BitmapWorkerPool'
import { NerpMsgParser } from './fileparser/NerpMsgParser'
import { ObjectiveTextParser } from './fileparser/ObjectiveTextParser'
import { WadParser } from './fileparser/WadParser'
import { AssetRegistry } from './AssetRegistry'
import { WadFile } from './fileparser/WadFile'
import { LWOUVParser } from './fileparser/LWOUVParser'
import { CabFile } from './fileparser/CabFile'
import { AudioContext } from 'three'
import { AVIParser } from './fileparser/avi/AVIParser'

export class AssetLoader {
    static readonly bitmapWorkerPool = new BitmapWorkerPool().startPool(16, null)

    readonly wad0File: WadFile
    readonly wad1File: WadFile
    readonly assetRegistry: AssetRegistry = new AssetRegistry(this)

    constructor(readonly cabFile: CabFile, wad0Content: ArrayBuffer, wad1Content: ArrayBuffer) {
        this.wad0File = WadFile.parseWadFile(wad0Content)
        this.wad1File = WadFile.parseWadFile(wad1Content)
    }

    loadWadImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryBuffer(name)
        AssetLoader.bitmapWorkerPool.decodeBitmap(data)
            .then((imgData) => callback([name], imgData))
    }

    loadWadTexture(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryBuffer(name)
        const alphaIndexMatch = name.toLowerCase().match(/(.*a)(\d+)(_.+)/)
        let alphaIndex = null
        const assetNames = [name]
        if (alphaIndexMatch) {
            assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
            alphaIndex = parseInt(alphaIndexMatch[2])
            AssetLoader.bitmapWorkerPool.decodeBitmapWithAlphaIndex(data, alphaIndex)
                .then((imgData) => {
                    if (name.toLowerCase().startsWith('miscanims/crystal')) { // XXX fix crystal lwo loading
                        callback(assetNames, this.grayscaleToGreen(imgData))
                    } else {
                        callback(assetNames, imgData)
                    }
                })
        } else if (name.match(/\/a.*\d.*/i)) {
            AssetLoader.bitmapWorkerPool.decodeBitmapWithAlpha(data).then((imgData) => callback(assetNames, imgData))
        } else {
            AssetLoader.bitmapWorkerPool.decodeBitmap(data).then((imgData) => callback(assetNames, imgData))
        }
    }

    grayscaleToGreen(imgData: ImageData): ImageData {
        const arr = imgData.data
        for (let c = 0; c < arr.length; c += 4) {
            arr[c] = 0
            arr[c + 2] = 0
        }
        return imgData
    }

    loadAlphaImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.wad0File.getEntryBuffer(name)
        AssetLoader.bitmapWorkerPool.decodeBitmapWithAlpha(data)
            .then((imgData) => {
                const assetNames = [name]
                const alphaIndexMatch = name.toLowerCase().match(/(.*a)(\d+)(_.+)/)
                if (alphaIndexMatch) assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
                callback(assetNames, imgData)
            })
    }

    loadFontImageAsset(name: string, callback: (assetNames: string[], obj: BitmapFontData) => any) {
        const data = this.wad0File.getEntryBuffer(name)
        AssetLoader.bitmapWorkerPool.decodeBitmap(data)
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
        const view = this.wad1File.getEntryArrayView(name)
        const result = new ObjectiveTextParser().parseObjectiveTextFile(view)
        callback([name], result)
    }

    loadMapAsset(name: string, callback: (assetNames: string[], obj: any) => any) {
        const view = this.wad0File.getEntryArrayView(name)
        if (view.length < 13 || String.fromCharCode(...view.slice(0, 3)) !== 'MAP') {
            console.error(`Invalid map data provided for: ${name}`)
            return
        }
        const map = WadParser.parseMap(view)
        callback([name], map)
    }

    loadObjectListAsset(name: string, callback: (assetNames: string[], obj: any) => any) {
        const data = this.wad0File.getEntryText(name)
        const objectList = WadParser.parseObjectList(data)
        callback([name], objectList)
    }

    async loadWavAsset(path: string, callback: (assetNames: string[], obj: any) => any) {
        let buffer: ArrayBufferLike
        const errors = []
        try { // localized wad1 file first, then generic wad0 file
            buffer = this.wad1File.getEntryBuffer(path)
        } catch (e1) {
            errors.push(e1)
            try {
                buffer = this.wad0File.getEntryBuffer(path)
            } catch (e2) {
                errors.push(e2)
                for (const folder of ['0007-German Files', '0009-English Files', '040c-French_(Standard)_Files', 'Program Data Files']) {
                    try {
                        buffer = await this.cabFile.getFileBuffer(`${folder}/Data/${path}`)
                    } catch (e) {
                        errors.push(e)
                    }
                }
                if (!buffer) {
                    const lPath = path.toLowerCase()
                    // XXX stats.wav and atmosdel.wav can only be found on ISO-File
                    if (!lPath.endsWith('/atmosdel.wav') &&
                        !lPath.endsWith('/stats.wav') &&
                        !lPath.endsWith('/dripsB.wav'.toLowerCase())
                    ) {
                        console.error(`Could not find sound ${path}:\n` + errors.join('\n'))
                    }
                    callback([path], null)
                    return
                }
            }
        }
        const audioBuffer = await AudioContext.getContext().decodeAudioData(buffer)
        callback([path], audioBuffer)
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

    async loadFlhAssetDefault(filename: string, callback: (assetNames: string[], obj: any) => any) {
        await this.loadFlhAssetInternal(filename, false, callback)
    }

    async loadFlhAssetInterframe(filename: string, callback: (assetNames: string[], obj: any) => any) {
        await this.loadFlhAssetInternal(filename, true, callback)
    }

    private async loadFlhAssetInternal(filename: string, interFrameMode: boolean, callback: (assetNames: string[], obj: any) => any) {
        let flhContent: DataView
        try {
            flhContent = this.wad0File.getEntryDataView(filename)
        } catch (e) {
            try {
                const arrayBuffer = await this.cabFile.getFileBuffer(filename)
                flhContent = new DataView(arrayBuffer)
            } catch (e) {
                const arrayBuffer = await this.cabFile.getFileBuffer(`Program Data Files/Data/${filename}`)
                flhContent = new DataView(arrayBuffer)
            }
        }
        const flhFrames = new FlhParser(flhContent, interFrameMode).parse()
        callback([filename], flhFrames)
    }

    loadUVFile(filename: string, callback: (assetNames: string[], obj: any) => any) {
        const uvContent = this.wad0File.getEntryText(filename)
        const uvData = new LWOUVParser().parse(uvContent)
        callback([filename], uvData)
    }

    async loadAVI(filename: string, callback: (assetNames: string[], obj: any) => any) {
        const buffer = await this.cabFile.getFileBuffer(`Program Data Files/Data/${filename}`)
        const dataView = new DataView(buffer)
        const decoder = new AVIParser(dataView).parse()
        callback([filename], decoder)
    }

    loadCreditsFile(filename: string, callback: (assetNames: string[], obj: any) => any) {
        const content = this.wad1File.getEntryText(this.wad1File.filterEntryNames(filename)[0])
        callback([filename], content)
    }
}
