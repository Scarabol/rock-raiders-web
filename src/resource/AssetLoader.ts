import { BitmapFontData } from '../core/BitmapFont'
import { getFilename } from '../core/Util'
import { FlhParser } from './fileparser/FlhParser'
import { BitmapWorkerPool } from '../worker/BitmapWorkerPool'
import { ObjectiveTextParser } from './fileparser/ObjectiveTextParser'
import { WadParser } from './fileparser/WadParser'
import { AssetRegistry } from './AssetRegistry'
import { LWOUVParser } from './fileparser/LWOUVParser'
import { AudioContext } from 'three'
import { AVIParser } from './fileparser/avi/AVIParser'
import { VirtualFileSystem } from './fileparser/VirtualFileSystem'
import { ResourceManager } from './ResourceManager'
import { SoundManager } from '../audio/SoundManager'
import { BitmapWithPalette } from './fileparser/BitmapWithPalette'

export class AssetLoader {
    readonly assetRegistry: AssetRegistry = new AssetRegistry(this)

    constructor(
        readonly vfs: VirtualFileSystem,
    ) {
    }

    loadRegisteredAssets(onProgress: (progress: number) => void) {
        console.log(`Loading ${this.assetRegistry.size} assets...`)
        const promises: Promise<void>[] = []
        let assetCount = 0
        this.assetRegistry.forEach((asset) => {
            promises.push(new Promise<void>((resolve) => {
                setTimeout(async () => {
                    try {
                        let assetName = asset.assetPath.toLowerCase()
                        const assetObj = await asset.method(assetName)
                        const alphaIndexMatch = assetName.match(/(.*a)(\d+)(_.+)/i)
                        if (alphaIndexMatch) assetName = alphaIndexMatch[1] + alphaIndexMatch[3]
                        ResourceManager.resourceByName.set(assetName, assetObj)
                        if (assetObj) asset.sfxKeys?.forEach((sfxKey) => SoundManager.sfxBuffersByKey.getOrUpdate(sfxKey, () => []).push(assetObj))
                        assetCount++
                        onProgress(assetCount / this.assetRegistry.size)
                        resolve()
                    } catch (e) {
                        if (!asset.optional) console.error(e)
                        assetCount++
                        onProgress(assetCount / this.assetRegistry.size)
                        resolve()
                    }
                })
            }))
        })
        return Promise.all(promises)
    }

    async loadWadImageAsset(name: string): Promise<BitmapWithPalette> {
        return BitmapWorkerPool.instance.decodeBitmap(this.vfs.getFile(name).toBuffer())
    }

    async loadWadTexture(name: string): Promise<BitmapWithPalette> {
        const data = this.vfs.getFile(name).toBuffer()
        const alphaIndexMatch = name.match(/(.*a)(\d+)(_.+)/i)
        if (alphaIndexMatch) {
            const alphaIndex = parseInt(alphaIndexMatch[2])
            return BitmapWorkerPool.instance.decodeBitmapWithAlphaIndex(data, alphaIndex)
        } else if (name.match(/\/a.*\d.*/i)) {
            return BitmapWorkerPool.instance.decodeBitmapWithAlpha(data)
        } else {
            return BitmapWorkerPool.instance.decodeBitmap(data)
        }
    }

    async loadAlphaImageAsset(name: string): Promise<ImageData> {
        return BitmapWorkerPool.instance.decodeBitmapWithAlpha(this.vfs.getFile(name).toBuffer())
    }

    async loadAlphaTranslucentImageAsset(name: string): Promise<ImageData> {
        return BitmapWorkerPool.instance.decodeBitmapWithAlphaTranslucent(this.vfs.getFile(name).toBuffer())
    }

    async loadFontImageAsset(name: string): Promise<BitmapFontData> {
        const imgData = await BitmapWorkerPool.instance.decodeBitmap(this.vfs.getFile(name).toBuffer())
        return new BitmapFontData(imgData)
    }

    async loadNerpAsset(name: string): Promise<string> {
        return this.vfs.getFile(name).toText()
    }

    async loadObjectiveTexts(name: string) {
        const text = this.vfs.getFile(name).toText(true)
        return new ObjectiveTextParser().parseObjectiveTextFile(text)
    }

    async loadMapAsset(name: string) {
        const view = this.vfs.getFile(name).toArray()
        if (view.length < 13 || String.fromCharCode(...view.slice(0, 3)) !== 'MAP') {
            throw new Error(`Invalid map data provided for: ${name}`)
        }
        return WadParser.parseMap(view)
    }

    async loadObjectListAsset(name: string) {
        const data = this.vfs.getFile(name).toText()
        return WadParser.parseObjectList(data)
    }

    async loadWavAsset(path: string) {
        let buffer: ArrayBufferLike | undefined
        const errors: unknown[] = []
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
                return null
            }
        }
        return AudioContext.getContext().decodeAudioData(buffer)
    }

    async loadLWOFile(lwoFilepath: string) {
        try {
            return this.vfs.getFile(lwoFilepath).toBuffer()
        } catch (e) {
            try {
                return this.vfs.getFile(`world/shared/${getFilename(lwoFilepath)}`).toBuffer()
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
                return null
            }
        }
    }

    async loadFlhAssetDefault(filename: string) {
        return this.loadFlhAssetInternal(filename, false)
    }

    async loadFlhAssetInterframe(filename: string) {
        return this.loadFlhAssetInternal(filename, true)
    }

    private async loadFlhAssetInternal(filename: string, interFrameMode: boolean) {
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
        return new FlhParser(flhContent, interFrameMode).parse()
    }

    async loadUVFile(filename: string) {
        const uvContent = this.vfs.getFile(filename).toText()
        return new LWOUVParser().parse(uvContent)
    }

    async loadAVI(filename: string) {
        const dataView = this.vfs.getFile(`Data/${filename}`).toDataView()
        return new AVIParser(dataView).parse()
    }

    async loadCreditsFile(filename: string) {
        return this.vfs.getFile(this.vfs.filterEntryNames(filename)[0]).toText(true)
    }
}
