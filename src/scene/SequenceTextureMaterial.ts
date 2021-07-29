import { DoubleSide, MeshPhongMaterial, Texture } from 'three'
import { SEQUENCE_TEXTURE_INTERVAL_MS } from '../params'

export class SequenceTextureMaterial extends MeshPhongMaterial {
    textures: Texture[] = []
    timer: number = 0
    seqNum: number = 0

    constructor(name: string) {
        super({
            side: DoubleSide,
            alphaToCoverage: true,
            shininess: 0,
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
        this.color.set(0xFFFFFF) // overwrite color, when color map (texture) in use
    }

    update(elapsedMs: number) {
        if (this.textures.length < 1) return
        this.timer += elapsedMs
        const addedSeqNum = Math.floor(this.timer / SEQUENCE_TEXTURE_INTERVAL_MS)
        this.timer -= addedSeqNum * SEQUENCE_TEXTURE_INTERVAL_MS
        this.seqNum = (this.seqNum + addedSeqNum) % this.textures.length
        this.map = this.textures[this.seqNum]
    }

    setOpacity(opacity: number) {
        this.opacity = opacity
        this.transparent = this.transparent || this.opacity < 1
    }
}
