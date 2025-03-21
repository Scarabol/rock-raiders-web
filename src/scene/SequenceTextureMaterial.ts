import { MeshPhongMaterial, Texture } from 'three'
import { SEQUENCE_TEXTURE_INTERVAL_MS } from '../params'

export class SequenceTextureMaterial extends MeshPhongMaterial {
    textures: Texture[] = []
    timer: number = 0
    seqNum: number = 0
    isSequenceTextureMaterial: boolean = true

    constructor(name: string) {
        super({
            alphaToCoverage: true,
            shininess: 0,
            emissiveIntensity: 0,
        })
        this.name = name
    }

    clone(): this {
        const clone = super.clone() as this
        clone.setTextures(this.textures)
        return clone
    }

    setTextures(textures: Texture[]) {
        this.textures = textures
        if (this.textures.length < 1) return
        this.map = this.textures[0]
        this.emissiveMap = this.map
        this.color.setScalar(1)
    }

    update(elapsedMs: number) {
        if (this.textures.length < 1) return
        this.timer += elapsedMs
        const addedSeqNum = Math.floor(this.timer / SEQUENCE_TEXTURE_INTERVAL_MS)
        this.timer -= addedSeqNum * SEQUENCE_TEXTURE_INTERVAL_MS
        this.seqNum = (this.seqNum + addedSeqNum) % this.textures.length
        this.map = this.textures[this.seqNum]
        this.emissiveMap = this.map
    }

    setOpacity(opacity: number) {
        this.opacity = opacity
        this.transparent = this.transparent || this.opacity < 1
    }
}
