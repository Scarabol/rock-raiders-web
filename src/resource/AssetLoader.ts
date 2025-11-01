import { getFilename } from '../core/Util'
import { BitmapWorkerPool } from '../worker/BitmapWorkerPool'
import { LevelObjectiveTexts, ObjectiveTextParser } from './fileparser/ObjectiveTextParser'
import { WadParser } from './fileparser/WadParser'
import { LWOUVParser, UVData } from './fileparser/LWOUVParser'
import { AudioContext, BufferGeometry, NearestFilter, RepeatWrapping, SRGBColorSpace, Texture } from 'three'
import { AVIFile, AVIParser } from './fileparser/avi/AVIParser'
import { AssetRegistry } from './AssetRegistry'
import { ResourceManager } from './ResourceManager'
import { BitmapWithPalette } from './fileparser/BitmapWithPalette'
import { FlhParser } from './fileparser/FlhParser'
import { imgDataToCanvas } from '../core/ImageHelper'
import { SoundManager } from '../audio/SoundManager'
import { BitmapFontData } from '../core/BitmapFont'
import { BitmapFontWorkerPool } from '../worker/BitmapFontWorkerPool'
import { TerrainMapData } from '../game/terrain/TerrainMapData'
import { ObjectListEntryCfg } from '../cfg/ObjectListEntryCfg'
import { SpriteImage } from '../core/Sprite'
import { SurfaceMeshPro } from '../game/terrain/SurfaceMesh'
import { LWOBParser, LWOBTextureLoader } from './fileparser/LWOBParser'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

export abstract class AssetLoader<T> {
    readonly lAssetName: string
    assetRegistry!: AssetRegistry
    data?: Promise<T>

    constructor(assetName: string, readonly optional: boolean = false) {
        this.lAssetName = assetName.toLowerCase()
    }

    abstract exec(): Promise<T>

    async load(): Promise<void> {
        if (!this.data) this.data = this.exec()
        await this.data
    }

    async wait(): Promise<T> {
        if (!this.data) throw new Error('Asset loading not yet started')
        return this.data
    }
}

export class ImageAssetLoader extends AssetLoader<BitmapWithPalette> {
    async exec(): Promise<BitmapWithPalette> {
        const data = this.assetRegistry.vfs.getFile(this.lAssetName).toBuffer()
        const bitmap = await BitmapWorkerPool.instance.decodeBitmap(data)
        ResourceManager.resourceByName.set(this.lAssetName, bitmap) // TODO Add image to cache instead
        return bitmap
    }
}

export class TextureAssetLoader extends AssetLoader<BitmapWithPalette> {
    async exec(): Promise<BitmapWithPalette> {
        const data = this.assetRegistry.vfs.getFile(this.lAssetName).toBuffer()
        const alphaIndexMatch = this.lAssetName.match(/(.*a)(\d+)(_.+)/i)
        let assetName: string = this.lAssetName, bitmap: BitmapWithPalette
        if (alphaIndexMatch) {
            assetName = alphaIndexMatch[1] + alphaIndexMatch[3]
            const alphaIndex = Number(alphaIndexMatch[2])
            bitmap = await BitmapWorkerPool.instance.decodeBitmapWithAlphaIndex(data, alphaIndex)
        } else if (this.lAssetName.match(/\/a.*\d.*/i)) {
            bitmap = await BitmapWorkerPool.instance.decodeBitmapWithAlpha(data)
        } else {
            bitmap = await BitmapWorkerPool.instance.decodeBitmap(data)
        }
        ResourceManager.resourceByName.set(assetName, bitmap) // TODO Add texture to cache instead
        return bitmap
    }
}

export class AlphaImageAssetLoader extends AssetLoader<BitmapWithPalette> {
    async exec(): Promise<BitmapWithPalette> {
        const data = this.assetRegistry.vfs.getFile(this.lAssetName).toBuffer()
        const bitmap = await BitmapWorkerPool.instance.decodeBitmapWithAlpha(data)
        const alphaIndexMatch = this.lAssetName.match(/(.*a)(\d+)(_.+)/i)
        const assetName = alphaIndexMatch ? alphaIndexMatch[1] + alphaIndexMatch[3] : this.lAssetName
        ResourceManager.resourceByName.set(assetName, bitmap) // TODO Add image to cache instead
        return bitmap
    }
}

export class AlphaTranslucentImageAssetLoader extends AssetLoader<BitmapWithPalette> {
    async exec(): Promise<BitmapWithPalette> {
        const data = this.assetRegistry.vfs.getFile(this.lAssetName).toBuffer()
        const bitmap = await BitmapWorkerPool.instance.decodeBitmapWithAlphaTranslucent(data)
        const alphaIndexMatch = this.lAssetName.match(/(.*a)(\d+)(_.+)/i)
        const assetName = alphaIndexMatch ? alphaIndexMatch[1] + alphaIndexMatch[3] : this.lAssetName
        ResourceManager.resourceByName.set(assetName, bitmap) // TODO Add image to cache instead
        return bitmap
    }
}

export class FontAssetLoader extends AssetLoader<BitmapFontData> {
    constructor(assetName: string, readonly charHeight: number) {
        super(assetName, false)
    }

    async exec(): Promise<BitmapFontData> {
        const data = this.assetRegistry.vfs.getFile(this.lAssetName).toBuffer()
        const bitmap = await BitmapWorkerPool.instance.decodeBitmap(data)
        const fontData = new BitmapFontData(bitmap, this.charHeight)
        await BitmapFontWorkerPool.instance.addFont(this.lAssetName, fontData)
        return fontData
    }
}

export class NerpScriptAssetLoader extends AssetLoader<string> {
    async exec(): Promise<string> {
        const script = this.assetRegistry.vfs.getFile(this.lAssetName).toText()
        ResourceManager.resourceByName.set(this.lAssetName, script) // TODO Add to specific cache
        return script
    }
}

export class ObjectiveTextsAssetLoader extends AssetLoader<LevelObjectiveTexts> {
    async exec(): Promise<LevelObjectiveTexts> {
        const text = this.assetRegistry.vfs.getFile(this.lAssetName).toText()
        const objectives = new ObjectiveTextParser().parseObjectiveTextFile(text) // TODO Turn ObjectiveTextParser into an AssetLoader
        ResourceManager.resourceByName.set(this.lAssetName, objectives) // TODO Add to specific cache
        return objectives
    }
}

export class MapAssetLoader extends AssetLoader<TerrainMapData> {
    async exec(): Promise<TerrainMapData> {
        const view = this.assetRegistry.vfs.getFile(this.lAssetName).toArray()
        if (view.length < 13 || String.fromCharCode(...view.slice(0, 3)) !== 'MAP') {
            throw new Error(`Invalid map data provided for: ${name}`)
        }
        const map = WadParser.parseMap(view) // TODO Turn WadParser into an AssetLoader
        ResourceManager.resourceByName.set(this.lAssetName, map) // TODO Add to specific cache
        return map
    }
}

export class ObjectListAssetLoader extends AssetLoader<Map<string, ObjectListEntryCfg>> {
    async exec(): Promise<Map<string, ObjectListEntryCfg>> {
        const data = this.assetRegistry.vfs.getFile(this.lAssetName).toText()
        const objectList = WadParser.parseObjectList(data) // TODO Turn WadParser into an AssetLoader
        ResourceManager.resourceByName.set(this.lAssetName, objectList) // TODO Add to specific cache
        return objectList
    }
}

export class SoundAssetLoader extends AssetLoader<AudioBuffer> {
    constructor(assetName: string, readonly sndKeys: string[]) {
        super(assetName, true)
    }

    async exec(): Promise<AudioBuffer> {
        let data: ArrayBuffer | undefined
        const errors: unknown[] = []
        try {
            data = this.assetRegistry.vfs.getFile(this.lAssetName).toBuffer()
        } catch (e2) {
            errors.push(e2)
            try {
                data = this.assetRegistry.vfs.getFile(`Data/${(this.lAssetName)}`).toBuffer()
            } catch (e) {
                errors.push(e)
            }
            if (!data) return Promise.reject(`Could not find sound ${(this.lAssetName)}:\n` + errors.join('\n'))
        }
        const audioBuffer = await AudioContext.getContext().decodeAudioData(data)
        ResourceManager.resourceByName.set(this.lAssetName, audioBuffer) // TODO Add only to sound buffer
        this.sndKeys.forEach((sndKey) => SoundManager.sfxBuffersByKey.getOrUpdate(sndKey, () => []).push(audioBuffer))
        return audioBuffer
    }
}

export class LWOAssetLoader extends AssetLoader<ArrayBuffer> {
    async exec(): Promise<ArrayBuffer> {
        let data: ArrayBuffer
        try {
            data = this.assetRegistry.vfs.getFile(this.lAssetName).toBuffer()
        } catch (e) {
            try {
                data = this.assetRegistry.vfs.getFile(`world/shared/${getFilename(this.lAssetName)}`).toBuffer()
            } catch (e) {
                return Promise.reject(`Could not load LWO file ${(this.lAssetName)}; Error: ${e}`)
            }
        }
        // TODO Parse LWO file here?
        ResourceManager.resourceByName.set(this.lAssetName, data) // TODO Add to specific cache
        return data
    }
}

export class FlhAssetLoader extends AssetLoader<SpriteImage[]> {
    constructor(assetName: string, optional: boolean, readonly interFrameMode: boolean) {
        super(assetName, optional)
    }

    async exec(): Promise<SpriteImage[]> {
        let flhContent: DataView
        try {
            flhContent = this.assetRegistry.vfs.getFile(this.lAssetName).toDataView()
        } catch (e) {
            try {
                flhContent = this.assetRegistry.vfs.getFile(this.lAssetName).toDataView()
            } catch (e) {
                flhContent = this.assetRegistry.vfs.getFile(`Data/${(this.lAssetName)}`).toDataView()
            }
        }
        const imgData = new FlhParser(flhContent, this.interFrameMode).parse()
        const images = imgData.map((i) => imgDataToCanvas(i))
        ResourceManager.resourceByName.set(this.lAssetName, images) // TODO Add images to cache instead
        return images
    }
}

export class UVAssetLoader extends AssetLoader<UVData> {
    async exec(): Promise<UVData> {
        const uvContent = this.assetRegistry.vfs.getFile(this.lAssetName).toText()
        const data = new LWOUVParser().parse(uvContent)
        ResourceManager.resourceByName.set(this.lAssetName, data) // TODO Add data to specific cache instead
        return data
    }
}

export class AVIAssetLoader extends AssetLoader<AVIFile> {
    async exec(): Promise<AVIFile> {
        const dataView = this.assetRegistry.vfs.getFile(`Data/${this.lAssetName}`).toDataView()
        const data = new AVIParser(dataView).parse()
        ResourceManager.resourceByName.set(this.lAssetName, data) // TODO Add data to specific cache instead
        return data
    }
}

export class CreditsAssetLoader extends AssetLoader<string> {
    async exec(): Promise<string> {
        const data = this.assetRegistry.vfs.getFile(this.assetRegistry.vfs.filterEntryNames(this.lAssetName)[0]).toText() // TODO Assert array length before accessing
        ResourceManager.resourceByName.set(this.lAssetName, data) // TODO Add data to specific cache instead
        return data
    }
}

class ProMeshTextureLoader extends LWOBTextureLoader {
    constructor(readonly assetRegistry: AssetRegistry, readonly flipY: boolean, readonly theme: string, readonly num: string) {
        super()
    }

    override load(_textureFilename: string, onLoad: (textures: Texture[]) => void): void {
        this.loadFromVfs().then((textures) => onLoad(textures))
    }

    async loadFromVfs(): Promise<Texture[]> {
        const textureFilePaths = this.assetRegistry.vfs.filterEntryNames(`World/WorldTextures/.+${this.theme}${this.num}.bmp`)
        return Promise.all(textureFilePaths.map(async (f) => {
            const imgData = await this.assetRegistry.getLoader<TextureAssetLoader>(f).wait()
            return this.createTexture(imgData, f)
        }))
    }

    private createTexture(imgData: ImageData, textureFilepath: string): Texture {
        // without repeat wrapping some entities are not fully textured
        const texture = new Texture(imgData, Texture.DEFAULT_MAPPING, RepeatWrapping, RepeatWrapping)
        texture.name = textureFilepath
        texture.needsUpdate = true // without everything is just dark
        texture.colorSpace = SRGBColorSpace
        texture.magFilter = NearestFilter
        if (this.flipY) texture.rotation += Math.PI
        return texture
    }
}

export class ProMeshLoader extends AssetLoader<SurfaceMeshPro> {
    constructor(readonly theme: string, readonly num: string) {
        super(`world/promeshes/${theme === 'ice' ? `${theme}/${theme}` : theme}pm${num}`, true) // ice in subfolder
    }

    async exec(): Promise<SurfaceMeshPro> {
        const meshFilePathA = `${this.lAssetName}a.lwo`
        if (!this.assetRegistry.vfs.hasEntry(meshFilePathA)) return Promise.reject(`Cannot load pro mesh, missing "${meshFilePathA}"`)
        const meshFilePathB = `${this.lAssetName}b.lwo`
        if (!this.assetRegistry.vfs.hasEntry(meshFilePathB)) return Promise.reject(`Cannot load pro mesh, missing "${meshFilePathB}"`)
        const meshFileContentA = this.assetRegistry.vfs.getFile(meshFilePathA)
        const meshFileContentB = this.assetRegistry.vfs.getFile(meshFilePathB)
        const proMeshTextureLoaderA = new ProMeshTextureLoader(this.assetRegistry, false, this.theme, this.num)
        const lwoDataA = new LWOBParser(meshFileContentA.toBuffer(), proMeshTextureLoaderA, undefined).parse()
        if (!lwoDataA) return Promise.reject('Cannot parse pro mesh A')
        const proMeshTextureLoaderB = new ProMeshTextureLoader(this.assetRegistry, true, this.theme, this.num)
        const lwoDataB = new LWOBParser(meshFileContentB.toBuffer(), proMeshTextureLoaderB, undefined).parse()
        if (!lwoDataB) return Promise.reject('Cannot parse pro mesh B')
        this.assembleGeometries(lwoDataA.geometry, lwoDataB.geometry)
        const proMesh = new SurfaceMeshPro(mergeGeometries([lwoDataA.geometry, lwoDataB.geometry], true), [...lwoDataA.material, ...lwoDataB.material])
        proMesh.position.set(0.5, 0, 0.5)
        ResourceManager.proMeshes.set(this.lAssetName, proMesh)
        return proMesh
    }

    assembleGeometries(geoA: BufferGeometry, geoB: BufferGeometry) {
        const scale1 = 0.4 // XXX ???
        const scale2 = 0.566 // XXX ???
        if (this.num.startsWith('0') || this.num.startsWith('2') || this.num === '40') { // walls
            geoA.scale(scale1, scale2, scale1)
            geoA.rotateY(Math.PI)
            geoA.rotateX(-Math.PI / 4)
            geoA.translate(-20, 0, 20)
            geoB.scale(scale1, scale2, scale1)
            geoB.rotateY(Math.PI)
            geoB.rotateX(Math.PI / 4)
            geoB.rotateZ(Math.PI)
            geoB.translate(20, 40, -20)
        } else if (this.num === '10') { // rubble
            geoA.scale(scale1, scale1, scale1)
            geoA.rotateX(Math.PI / 2)
            geoA.translate(20, 0, -20)
            geoB.scale(scale1, scale1, scale1)
            geoB.rotateX(Math.PI / 2)
            geoB.rotateY(Math.PI)
            geoB.translate(-20, 0, 20)
        } else if (this.num.startsWith('3')) { // inverted corner
            geoA.scale(scale2, scale1, scale1)
            geoA.rotateY(Math.PI / 2)
            geoA.rotateZ(-Math.PI / 2)
            geoA.rotateX(Math.PI / 4)
            geoA.translate(-20, 40, -20)
            geoB.scale(scale1, scale2, scale1)
            geoB.rotateY(Math.PI / 2)
            geoB.rotateX(Math.PI)
            geoB.rotateZ(-Math.PI / 4)
            geoB.translate(20, 40, 20)
        } else if (this.num.startsWith('5')) { // corner
            geoA.scale(scale1, scale2, scale1)
            geoA.rotateX(Math.PI / 4)
            geoA.rotateY(Math.PI / 2)
            geoA.translate(-20, 0, -20)
            geoB.scale(scale2, scale1, scale1)
            geoB.rotateY(Math.PI)
            geoB.rotateZ(Math.PI / 2)
            geoB.rotateX(-Math.PI / 4)
            geoB.translate(20, 0, 20)
        } else {
            console.warn(`Unexpected num (${(this.num)}) given`)
        }
    }
}
