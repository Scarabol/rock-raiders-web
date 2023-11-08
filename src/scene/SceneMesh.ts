import { BufferGeometry, Material, Mesh } from 'three'
import { SequenceTextureMaterial } from './SequenceTextureMaterial'

export class SceneMesh extends Mesh {
    constructor(geometry?: BufferGeometry, material?: Material | Material[], name?: string) {
        super(geometry, material)
        this.name = name ?? ''
    }

    clone(): this {
        const clone = super.clone(true)
        clone.material = this.getMaterials().map((m) => m.clone())
        return clone
    }

    dispose() {
        this.geometry?.dispose()
        this.getMaterials().forEach((m) => m.dispose())
        this.material = null
    }

    getMaterials(): SequenceTextureMaterial[] {
        return Array.ensure(this.material as SequenceTextureMaterial | SequenceTextureMaterial[])
    }

    update(elapsedMs: number) {
        this.getMaterials().forEach((m) => m.hasTextureSequence && m.update(elapsedMs))
    }
}
