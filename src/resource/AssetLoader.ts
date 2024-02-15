import { BitmapFontData } from '../core/BitmapFont'
import { getFilename } from '../core/Util'
import { FlhParser } from './fileparser/FlhParser'
import { BitmapWorkerPool } from '../worker/BitmapWorkerPool'
import { NerpMsgParser } from './fileparser/NerpMsgParser'
import { ObjectiveTextParser } from './fileparser/ObjectiveTextParser'
import { WadParser } from './fileparser/WadParser'
import { AssetRegistry } from './AssetRegistry'
import { LWOUVParser } from './fileparser/LWOUVParser'
import { AudioContext } from 'three'
import { AVIParser } from './fileparser/avi/AVIParser'
import { VirtualFileSystem } from './fileparser/VirtualFileSystem'
import { ResourceManager } from './ResourceManager'
import { SoundManager } from '../audio/SoundManager'

export class AssetLoader {
    static readonly bitmapWorkerPool = new BitmapWorkerPool().startPool(16, null)

    readonly assetRegistry: AssetRegistry = new AssetRegistry(this)

    constructor(
        readonly vfs: VirtualFileSystem,
    ) {
    }

    loadRegisteredAssets(onLoad: () => void) {
        console.log(`Loading ${this.assetRegistry.size} assets...`)
        const promises: Promise<void>[] = []
        this.assetRegistry.forEach((asset) => {
            promises.push(new Promise<void>((resolve) => {
                setTimeout(() => {
                    try {
                        asset.method(asset.assetPath, (assetNames, assetObj) => {
                            assetNames.forEach((assetName) => ResourceManager.resourceByName.set(assetName.toLowerCase(), assetObj))
                            if (assetObj) asset.sfxKeys?.forEach((sfxKey) => SoundManager.sfxBuffersByKey.getOrUpdate(sfxKey, () => []).push(assetObj))
                            onLoad()
                            resolve()
                        })
                    } catch (e) {
                        if (!asset.optional) console.error(e)
                        onLoad()
                        resolve()
                    }
                })
            }))
        })
        return Promise.all(promises)
    }

    loadWadImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        AssetLoader.bitmapWorkerPool.decodeBitmap(this.vfs.getFile(name).toBuffer())
            .then((imgData) => callback([name], imgData))
    }

    loadWadTexture(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        const data = this.vfs.getFile(name).toBuffer()
        const alphaIndexMatch = name.toLowerCase().match(/(.*a)(\d+)(_.+)/)
        let alphaIndex = null
        const assetNames = [name]
        if (alphaIndexMatch) {
            assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
            alphaIndex = parseInt(alphaIndexMatch[2])
            AssetLoader.bitmapWorkerPool.decodeBitmapWithAlphaIndex(data, alphaIndex).then((imgData) => callback(assetNames, imgData))
        } else if (name.match(/\/a.*\d.*/i)) {
            AssetLoader.bitmapWorkerPool.decodeBitmapWithAlpha(data).then((imgData) => callback(assetNames, imgData))
        } else {
            AssetLoader.bitmapWorkerPool.decodeBitmap(data).then((imgData) => callback(assetNames, imgData))
        }
    }

    loadAlphaImageAsset(name: string, callback: (assetNames: string[], obj: ImageData) => any) {
        AssetLoader.bitmapWorkerPool.decodeBitmapWithAlpha(this.vfs.getFile(name).toBuffer())
            .then((imgData) => {
                const assetNames = [name]
                const alphaIndexMatch = name.toLowerCase().match(/(.*a)(\d+)(_.+)/)
                if (alphaIndexMatch) assetNames.push(alphaIndexMatch[1] + alphaIndexMatch[3])
                callback(assetNames, imgData)
            })
    }

    loadFontImageAsset(name: string, callback: (assetNames: string[], obj: BitmapFontData) => any) {
        AssetLoader.bitmapWorkerPool.decodeBitmap(this.vfs.getFile(name).toBuffer())
            .then((imgData) => {
                callback([name], new BitmapFontData(imgData))
            })
    }

    loadNerpAsset(name: string, callback: (assetNames: string[], obj: string) => any) {
        const nrnName = name.replace(/\.npl$/, '.nrn')
        const script = this.vfs.getFile(nrnName).toText()
        callback([name, nrnName], script)
    }

    loadNerpMsg(name: string, callback: (assetNames: string[], obj: any) => any) {
        const wadData = this.vfs.getFile(name).toText(true)
        const result = NerpMsgParser.parseNerpMessages(wadData)
        callback([name], result)
    }

    loadObjectiveTexts(name: string, callback: (assetNames: string[], obj: any) => any) {
        const text = this.vfs.getFile(name).toText(true)
        const result = new ObjectiveTextParser().parseObjectiveTextFile(text)
        callback([name], result)
    }

    loadMapAsset(name: string, callback: (assetNames: string[], obj: any) => any) {
        const view = this.vfs.getFile(name).toArray()
        if (view.length < 13 || String.fromCharCode(...view.slice(0, 3)) !== 'MAP') {
            console.error(`Invalid map data provided for: ${name}`)
            return
        }
        const map = WadParser.parseMap(view)
        callback([name], map)
    }

    loadObjectListAsset(name: string, callback: (assetNames: string[], obj: any) => any) {
        const data = this.vfs.getFile(name).toText()
        const objectList = WadParser.parseObjectList(data)
        callback([name], objectList)
    }

    async loadWavAsset(path: string, callback: (assetNames: string[], obj: any) => any) {
        let buffer: ArrayBufferLike
        const errors = []
        try {
            buffer = this.vfs.getFile(path).toBuffer()
        } catch (e2) {
            errors.push(e2)
            try {
                buffer = this.vfs.getFile(`Data/${path}`).toBuffer()
            } catch (e) {
                errors.push(e)
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
        const audioBuffer = await AudioContext.getContext().decodeAudioData(buffer)
        callback([path], audioBuffer)
    }

    loadLWOFile(lwoFilepath: string, callback: (assetNames: string[], obj: any) => any) {
        let lwoContent = null
        try {
            lwoContent = this.vfs.getFile(lwoFilepath).toBuffer()
        } catch (e) {
            try {
                lwoContent = this.vfs.getFile(`world/shared/${getFilename(lwoFilepath)}`).toBuffer()
            } catch (e) {
                if (!lwoFilepath.equalsIgnoreCase('Vehicles/BullDozer/VLBD_light.lwo') // ignore known issues
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_bucket.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_main.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_C_Pit.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_Light01.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/digbodlight.lwo')
                    && !lwoFilepath.equalsIgnoreCase('Vehicles/LargeDigger/LD_PipeL.lwo')) {
                    throw new Error(`Could not load LWO file ${lwoFilepath}; Error: ${e}`)
                }
            }
        }
        callback([lwoFilepath], lwoContent)
    }

    loadFlhAssetDefault(filename: string, callback: (assetNames: string[], obj: any) => any) {
        this.loadFlhAssetInternal(filename, false, callback)
    }

    loadFlhAssetInterframe(filename: string, callback: (assetNames: string[], obj: any) => any) {
        this.loadFlhAssetInternal(filename, true, callback)
    }

    private loadFlhAssetInternal(filename: string, interFrameMode: boolean, callback: (assetNames: string[], obj: any) => any) {
        let flhContent: DataView
        try {
            flhContent = this.vfs.getFile(filename).toDataView()
        } catch (e) {
            try {
                flhContent = this.vfs.getFile(filename).toDataView()
            } catch (e) {
                flhContent = this.vfs.getFile(`Data/${filename}`).toDataView()
            }
        }
        const flhFrames = new FlhParser(flhContent, interFrameMode).parse()
        callback([filename], flhFrames)
    }

    loadUVFile(filename: string, callback: (assetNames: string[], obj: any) => any) {
        const uvContent = this.vfs.getFile(filename).toText()
        const uvData = new LWOUVParser().parse(uvContent)
        callback([filename], uvData)
    }

    loadAVI(filename: string, callback: (assetNames: string[], obj: any) => any) {
        const dataView = this.vfs.getFile(`Data/${filename}`).toDataView()
        const decoder = new AVIParser(dataView).parse()
        callback([filename], decoder)
    }

    loadCreditsFile(filename: string, callback: (assetNames: string[], obj: any) => any) {
        const content = this.vfs.getFile(this.vfs.filterEntryNames(filename)[0]).toText(true)
        callback([filename], content)
    }
}
