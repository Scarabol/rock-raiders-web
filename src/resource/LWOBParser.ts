// noinspection JSBitwiseOperatorUsage

/**
 * This loader loads LWOB files exported from LW
 *
 * File format description: https://www.sandbox.de/osg/lightwave.htm
 */

import { AdditiveBlending, BufferAttribute, BufferGeometry, ClampToEdgeWrapping, Color, DoubleSide, Loader, MirroredRepeatWrapping, RepeatWrapping, Texture, Vector3 } from 'three'
import { getFilename } from '../core/Util'
import { DEV_MODE } from '../params'
import { SceneMesh } from '../scene/SceneMesh'
import { SequenceTextureMaterial } from '../scene/SequenceTextureMaterial'

/*************************/
/* FLAG DEFINITION START */
/*************************/

const LUMINOUS_BIT = 1
const OUTLINE_BIT = 2
const SMOOTHING_BIT = 4
const COLORHIGHLIGHTS_BIT = 8
const COLORFILTER_BIT = 16
const OPAQUEEDGE_BIT = 32
const TRANSPARENTEDGE_BIT = 64
const SHARPTERMINATOR_BIT = 128
const DOUBLESIDED_BIT = 256
const ADDITIVE_BIT = 512
const SHADOWALPHA_BIT = 1024

/*************************/
/*  FLAG DEFINITION END  */
/*************************/

/*************************/
/* TFLG DEFINITION START */
/*************************/

const XAXIS_BIT = 1
const YAXIS_BIT = 2
const ZAXIS_BIT = 4
const WORLDCOORDS_BIT = 8
const NEGATIVEIMAGE_BIT = 16
const PIXELBLENDING_BIT = 32
const ANTIALIASING_BIT = 64

/*************************/
/*  TFLG DEFINITION END  */
/*************************/

export class LWOBParser {
    readonly lwoReader: LWOBFileReader
    materials: SequenceTextureMaterial[] = []
    geometry: BufferGeometry = new BufferGeometry()
    vertices: Float32Array = null
    indices: Uint16Array = null
    uvs: Float32Array = null

    constructor(
        buffer: ArrayBuffer,
        readonly textureLoader: LWOBTextureLoader,
        readonly verbose: boolean = false,
    ) {
        this.lwoReader = new LWOBFileReader(buffer)
    }

    parse(): SceneMesh {
        if (this.lwoReader.readIDTag() !== 'FORM') {
            console.error('LWOLoader.parse: Cannot find header.')
            return null
        }

        const fileSize = this.lwoReader.readUint32()
        const readerByteLength = this.lwoReader.byteLength
        if (fileSize + 8 !== readerByteLength) {
            console.warn(`LWOLoader.parse: Discrepancy between size in header (${fileSize + 8} bytes) and actual size (${readerByteLength} bytes).`)
        }

        const magic = this.lwoReader.readString(4)
        if (magic !== 'LWOB') {
            console.error(`LWOLoader.parse: Invalid magic ID (${magic}) in LWO header.`)
            return null
        }

        while (!this.lwoReader.endOfFile()) {
            const cursor = this.lwoReader.cursor
            const chunkType = this.lwoReader.readString(4)
            const chunkSize = this.lwoReader.readUint32()
            if (this.verbose) console.log(`${chunkType} ( ${cursor} ) -> ( ${cursor + chunkSize + 8})`)

            switch (chunkType) {
                case 'PNTS':
                    this.parsePoints(chunkSize)
                    break
                case 'SRFS':
                    this.parseSurfaceNames(chunkSize)
                    break
                case 'POLS':
                    this.parsePolygons(chunkSize)
                    break
                case 'SURF':
                    this.parseSurface(chunkSize)
                    break
                default:
                    console.warn(`${chunkType} ( ${cursor} ) -> ( ${cursor + chunkSize + 8}) Skipping unrecognised chunk type`)
                    this.lwoReader.skip(chunkSize)
                    break
            }
        }

        this.geometry.setAttribute('position', new BufferAttribute(this.vertices, 3))
        this.geometry.setAttribute('uv', new BufferAttribute(this.uvs, 2))
        this.geometry.setIndex(new BufferAttribute(this.indices, 1))
        this.geometry.computeVertexNormals()

        return new SceneMesh(this.geometry, this.materials)
    }

    parsePoints(chunkSize: number): void {
        if (chunkSize % 12 !== 0) {
            console.error(`LWOLoader.parse: F12 does not evenly divide into chunk size (${chunkSize}). Possible corruption.`)
            return
        }
        const vertices = []
        for (let c = 0; c < chunkSize; c += 12) {
            vertices.push(
                this.lwoReader.readFloat32(), // x
                this.lwoReader.readFloat32(), // y
                this.lwoReader.readFloat32(), // z
            )
        }
        this.vertices = new Float32Array(vertices)
        this.uvs = new Float32Array(vertices.length / 3 * 2) // x/y UV coords per vertex
    }

    parseSurfaceNames(chunkSize: number): void {
        this.materials = this.lwoReader.readStringArray(chunkSize).map((name) => new SequenceTextureMaterial(name))
        if (this.verbose) console.log(`LWO contains ${this.materials.length} materials with following names: ${this.materials.map((m) => m.name)}`)
    }

    parsePolygons(chunkSize: number): void {
        let offset = 0
        let currentIndex = 0
        const indices = []
        while (offset < chunkSize) {
            const numIndices = this.lwoReader.readUint16()
            const faceIndices = []
            for (let i = 0; i < numIndices; i++) {
                faceIndices[i] = this.lwoReader.readUint16()
            }
            const materialIndex = this.lwoReader.readUint16() - 1
            this.geometry.addGroup(indices.length, (numIndices - 2) * 3, materialIndex)
            switch (numIndices) {
                case 3:
                    indices[currentIndex++] = faceIndices[0]
                    indices[currentIndex++] = faceIndices[1]
                    indices[currentIndex++] = faceIndices[2]
                    break
                case 4: // split quad face into two triangles
                    indices[currentIndex++] = faceIndices[0]
                    indices[currentIndex++] = faceIndices[1]
                    indices[currentIndex++] = faceIndices[2]
                    indices[currentIndex++] = faceIndices[0]
                    indices[currentIndex++] = faceIndices[2]
                    indices[currentIndex++] = faceIndices[3]
                    break
                case 5: // split face into triangles
                    indices[currentIndex++] = faceIndices[0]
                    indices[currentIndex++] = faceIndices[1]
                    indices[currentIndex++] = faceIndices[2]
                    indices[currentIndex++] = faceIndices[0]
                    indices[currentIndex++] = faceIndices[2]
                    indices[currentIndex++] = faceIndices[4]
                    indices[currentIndex++] = faceIndices[4]
                    indices[currentIndex++] = faceIndices[2]
                    indices[currentIndex++] = faceIndices[3]
                    break
                default:
                    if (!DEV_MODE) console.warn(`Expected face with 3 or 4 indices but got ${numIndices} instead`)
            }
            offset += 2 + (numIndices * 2) + 2
        }
        this.indices = new Uint16Array(indices)
    }

    parseSurface(chunkSize: number): void {
        const chunkEnd = this.lwoReader.cursor + chunkSize
        const materialName = this.lwoReader.readString()
        if (this.verbose) console.log(`Start parsing surface: "${materialName}"`)
        let materialIndex = -1
        let material: SequenceTextureMaterial = null
        for (let i = 0; i < this.materials.length; i++) {
            if (this.materials[i].name === materialName) {
                materialIndex = i
                material = this.materials[i]
            }
        }
        if (!material) {
            console.error(`LWOLoader.parse: Surface "${materialName}" in SURF chunk does not exist in SRFS chunk`)
            return
        }

        let textureFlags = 0
        let textureSize = new Vector3(0, 0, 0)
        let textureCenter = new Vector3(0, 0, 0)
        // let textureFalloff = new Vector3(0, 0, 0);
        // let textureVelocity = new Vector3(0, 0, 0);

        while (this.lwoReader.cursor < chunkEnd) {
            const cursor = this.lwoReader.cursor
            const subChunkType = this.lwoReader.readString(4)
            const subChunkSize = this.lwoReader.readUint16()
            if (this.verbose) console.log(`${subChunkType} ( ${cursor} ) -> ( ${(cursor + subChunkSize)} )`)

            switch (subChunkType) {
                case 'COLR':
                    const colorArray = [
                        this.lwoReader.readUint8() / 255,
                        this.lwoReader.readUint8() / 255,
                        this.lwoReader.readUint8() / 255,
                        this.lwoReader.readUint8() / 255,
                    ]
                    material.color = new Color().fromArray(colorArray)
                    if (this.verbose) console.log(`Material color (COLR): ${colorArray.join(' ')}`)
                    break
                case 'FLAG':
                    const flags = this.lwoReader.readUint16()
                    if (this.verbose) console.log(`Flags (FLAG): ${flags.toString(2)}`)
                    if (this.verbose && flags & LUMINOUS_BIT) console.warn('Flag is set but unhandled: luminous') // flag replaced with LUMI below
                    if (this.verbose && flags & OUTLINE_BIT) console.warn('Flag is set but unhandled: outline')
                    if (flags & SMOOTHING_BIT) material.flatShading = true
                    if (this.verbose && flags & COLORHIGHLIGHTS_BIT) console.warn('Flag is set but unhandled: colorHighlights')
                    if (this.verbose && flags & COLORFILTER_BIT) console.warn('Flag is set but unhandled: colorFilter')
                    if (this.verbose && flags & OPAQUEEDGE_BIT) console.warn('Flag is set but unhandled: opaqueEdge')
                    if (this.verbose && flags & TRANSPARENTEDGE_BIT) console.warn('Flag is set but unhandled: transparentEdge')
                    if (this.verbose && flags & SHARPTERMINATOR_BIT) console.warn('Flag is set but unhandled: sharpTerminator')
                    if (flags & DOUBLESIDED_BIT) material.side = DoubleSide
                    if (flags & ADDITIVE_BIT) {
                        material.blending = AdditiveBlending
                        material.depthWrite = false // otherwise transparent parts "carve out" objects behind
                    }
                    if (this.verbose && flags & SHADOWALPHA_BIT) console.warn('Flag is set but unhandled: shadowAlpha')
                    break
                case 'RIND':
                    const refractiveIndex = this.lwoReader.readFloat32()
                    material.refractionRatio = 1 / refractiveIndex
                    break
                case 'EDGE':
                    const edgeTransparencyThreshold = this.lwoReader.readFloat32()
                    if (this.verbose) console.warn(`Edge transparency threshold (0.0 to 1.0): ${edgeTransparencyThreshold}`)
                    break
                case 'SMAN':
                    const maxSmoothAngle = this.lwoReader.readFloat32()
                    if (this.verbose) console.warn(`Implement maximum angle between two adjacent polygons that can be smooth shaded: ${maxSmoothAngle}`)
                    break
                case 'LUMI':
                    const luminosity = this.lwoReader.readUint16() / 256
                    if (this.verbose) console.log(`Luminosity (LUMI): ${luminosity}`)
                    material.emissiveIntensity = luminosity
                    break
                case 'DIFF':
                    const diffuse = this.lwoReader.readUint16() / 256
                    if (this.verbose) console.log(`Diffuse (DIFF): ${diffuse}`)
                    if (!diffuse) material.color = null
                    break
                case 'SPEC':
                    const specular = this.lwoReader.readUint16() / 256
                    // material.specular = material.color.multiplyScalar(specular);
                    if (this.verbose) console.warn(`Unhandled specular (SPEC): ${specular}`)
                    break
                case 'GLOS':
                    const glossiness = this.lwoReader.readUint16() / 1024
                    if (this.verbose) console.warn(`Unhandled glossiness (GLOS): ${glossiness}`)
                    break
                case 'REFL':
                case 'VRFL':
                    let reflection = 0
                    if (subChunkType === 'VRFL') {
                        reflection = this.lwoReader.readFloat32()
                    } else {
                        reflection = this.lwoReader.readUint16() / 256
                    }
                    material.reflectivity = reflection
                    if (this.verbose) console.log(`Reflectivity (REFL): ${material.reflectivity}`)
                    break
                case 'TRAN':
                case 'VTRN':
                    let transparency = 0
                    if (subChunkType === 'VTRN') {
                        transparency = this.lwoReader.readFloat32()
                    } else {
                        transparency = this.lwoReader.readUint16() / 256
                    }
                    material.setOpacity(1 - transparency)
                    if (this.verbose) console.log(`Opacity (TRAN/VTRN): ${material.opacity}`)
                    break
                case 'VLUM':
                    const vLuminosity = this.lwoReader.readFloat32()
                    if (this.verbose) console.log(`Luminosity (VLUM): ${vLuminosity}`)
                    material.emissiveIntensity = vLuminosity
                    break
                case 'VDIF':
                    let vDiffuse = this.lwoReader.readFloat32()
                    if (this.verbose) console.log(`Diffuse (VDIF): ${vDiffuse}`)
                    // material.vertexColors = !!vDiffuse // XXX push vertex colors first
                    break
                case 'VSPC':
                    let vSpecular = this.lwoReader.readFloat32()
                    // material.specular = material.color.multiplyScalar(vSpecular);
                    if (this.verbose) console.warn(`Specular (VSPC): ${vSpecular}`)
                    break
                case 'CTEX': // start of new texture sub-chunk
                case 'DTEX':
                case 'STEX':
                case 'RTEX':
                case 'TTEX':
                case 'BTEX':
                    const textureTypeName = this.lwoReader.readString()
                    if (this.verbose) console.log(`Texture typename: ${textureTypeName}`)
                    break
                case 'TFLG':
                    textureFlags = this.lwoReader.readUint16()
                    if (this.verbose) console.log(`Flags (TFLG): ${textureFlags.toString(2)}`)
                    if (this.verbose && textureFlags & XAXIS_BIT) console.warn('Texture flag is set but unhandled: X Axis')
                    if (this.verbose && textureFlags & YAXIS_BIT) console.warn('Texture flag is set but unhandled: Y Axis')
                    if (this.verbose && textureFlags & ZAXIS_BIT) console.warn('Texture flag is set but unhandled: Z Axis')
                    if (this.verbose && textureFlags & WORLDCOORDS_BIT) console.warn('Texture flag is set but unhandled: World Coords')
                    if (this.verbose && textureFlags & NEGATIVEIMAGE_BIT) console.warn('Texture flag is set but unhandled: Negative Image')
                    if (this.verbose && textureFlags & PIXELBLENDING_BIT) console.warn('Texture flag is set but unhandled: Pixel Blending')
                    if (this.verbose && textureFlags & ANTIALIASING_BIT) console.log('Texture flag is set: Antialiasing') // turned on by default
                    break
                case 'TSIZ':
                    textureSize = new Vector3(this.lwoReader.readFloat32(), this.lwoReader.readFloat32(), this.lwoReader.readFloat32())
                    if (this.verbose) console.log(`Texture size (TSIZ): ${textureSize.toArray().join(' ')}`)
                    break
                case 'TCTR':
                    textureCenter = new Vector3(this.lwoReader.readFloat32(), this.lwoReader.readFloat32(), this.lwoReader.readFloat32())
                    if (this.verbose) console.warn(`Unhandled texture center (TCTR): ${textureCenter.toArray().join(' ')}`)
                    break
                case 'TCLR':
                    const textureColorArray = [
                        this.lwoReader.readUint8() / 255,
                        this.lwoReader.readUint8() / 255,
                        this.lwoReader.readUint8() / 255,
                        this.lwoReader.readUint8() / 255,
                    ]
                    // const textureColor = new Color().fromArray(textureColorArray);
                    // seems to be 0 0 0 anyway...
                    if (this.verbose) console.log(`Unhandled texture color (TCLR): ${textureColorArray.join(' ')}`)
                    break
                case 'TVAL':
                    const textureValue = this.lwoReader.readUint16() / 256
                    if (this.verbose) console.warn(`Unhandled texture value (TVAL): ${textureValue}`)
                    break
                case 'TIMG':
                    const textureFilepath = this.lwoReader.readString()
                    if (this.verbose) console.log(`Texture filepath (TIMG): ${textureFilepath}`)
                    const lTextureFilename = getFilename(textureFilepath)?.toLowerCase()
                    material.transparent = material.transparent || !!lTextureFilename.match(/(.*a)(\d+)(_.+)/)
                    this.textureLoader.load(lTextureFilename, (t) => material.setTextures(t))
                    break
                case 'TWRP':
                    const horizontalWrappingMode = this.parseWrappingMode(this.lwoReader.readUint16())
                    const verticalWrappingMode = this.parseWrappingMode(this.lwoReader.readUint16())
                    material.textures.forEach((t) => {
                        t.wrapS = horizontalWrappingMode
                        t.wrapT = verticalWrappingMode
                    })
                    break
                case 'TAAS':
                    const antialiasingStrength = this.lwoReader.readFloat32()
                    if (this.verbose) console.log(`Antialiasing strength: ${antialiasingStrength} (not supported by three.js)`)
                    break
                default: // TODO implement all LWOB features
                    if (this.verbose || !DEV_MODE) console.warn(`Found unrecognised SURF sub-chunk type ${subChunkType} (${subChunkType}) at ${cursor}; length ${subChunkSize}`)
                    this.lwoReader.skip(subChunkSize)
                    break
            }
        }

        this.planarMapUVS(materialIndex, textureSize, textureCenter, textureFlags)

        if (this.verbose) console.log(`Done parsing surface: "${materialName}"`)
    }

    parseWrappingMode(wrap: number) {
        if (wrap === 0) { // Unsupported texture wrapping mode with black color outside of texture image
            return ClampToEdgeWrapping
        } else if (wrap === 1) {
            return ClampToEdgeWrapping
        } else if (wrap === 2) {
            return RepeatWrapping
        } else if (wrap === 3) {
            return MirroredRepeatWrapping
        } else {
            console.warn(`Unexpected texture wrapping mode given: ${wrap}`)
            return RepeatWrapping
        }
    }

    planarMapUVS(materialIndex, size, center, flags) {
        // Check to ensure that one of the flags is set, if not throw an error.
        const mask = XAXIS_BIT | YAXIS_BIT | ZAXIS_BIT
        if (!(flags & mask)) {
            // console.warn("LWOLoader.planarMapUVS: No axis bit is set!"); // XXX what is this about
            return
        }
        for (let group of this.geometry.groups) {
            if (group.materialIndex !== materialIndex) continue

            for (let i = group.start; i < group.start + group.count; i++) {
                let vertexIndex = this.indices[i] * 3
                let x = this.vertices[vertexIndex] - center.x
                let y = this.vertices[vertexIndex + 1] - center.y
                let z = this.vertices[vertexIndex + 2] - center.z

                let uvIndex = this.indices[i] * 2
                let u = 0
                let v = 0

                if (flags & XAXIS_BIT) {
                    u = z / size.z + 0.5
                    v = y / size.y + 0.5
                } else if (flags & YAXIS_BIT) {
                    u = x / size.x + 0.5
                    v = z / size.z + 0.5
                } else if (flags & ZAXIS_BIT) {
                    u = x / size.x + 0.5
                    v = y / size.y + 0.5
                }

                this.uvs[uvIndex] = u
                this.uvs[uvIndex + 1] = v
            }
        }
    }
}

export class LWOBTextureLoader extends Loader {

    constructor(readonly meshPath: string, readonly entityPath: string) {
        super()
    }

    load(textureFilename: string, onLoad: (textures: Texture[]) => any): void {
    }
}

class LWOBFileReader {

    private readonly dataView: DataView
    private offset: number = 0

    constructor(buffer: ArrayBuffer) {
        this.dataView = new DataView(buffer)
    }

    skip(length: number): void {
        this.offset += length
    }

    endOfFile(): boolean {
        return this.offset >= this.byteLength
    }

    get cursor(): number {
        return this.offset
    }

    get byteLength(): number {
        return this.dataView.byteLength
    }

    // An ID tag is a sequence of 4 bytes containing 7-bit ASCII values
    readIDTag(): string {
        return this.readString(4)
    }

    readString(size: number = null): string {
        if (size === 0) return ''
        const charBuffer = []
        if (size) {
            for (let c = 0; c < size; c++) {
                charBuffer[c] = this.readUint8()
            }
        } else {
            let currentChar = null
            let length = 0
            while (currentChar !== 0) {
                currentChar = this.readUint8()
                if (currentChar !== 0) charBuffer.push(currentChar)
                length++
            }
            if (length % 2 !== 0) this.skip(1) // if string is uneven, extra nullbyte is skipped
        }
        return new TextDecoder().decode(new Uint8Array(charBuffer))
    }

    readStringArray(size: number): string[] {
        return this.readString(size).split('\0').filter(Boolean)
    }

    readUint8(): number {
        const value = this.dataView.getUint8(this.offset)
        this.offset += 1
        return value
    }

    readUint16(): number {
        const value = this.dataView.getUint16(this.offset)
        this.offset += 2
        return value
    }

    readUint32(): number {
        const value = this.dataView.getUint32(this.offset)
        this.offset += 4
        return value
    }

    readFloat32(): number {
        const value = this.dataView.getFloat32(this.offset)
        this.offset += 4
        return value
    }
}
