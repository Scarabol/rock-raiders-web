import { BufferGeometry, Mesh } from 'three'
import { SequenceTextureMaterial } from './SequenceTextureMaterial'

export class SceneMesh extends Mesh<BufferGeometry, SequenceTextureMaterial[]> {
    constructor(geometry?: BufferGeometry, material?: SequenceTextureMaterial[], name?: string) {
        super(geometry, material ?? [])
        this.name = name ?? ''
    }

    clone(): this {
        const clone = super.clone(true)
        clone.material = this.material.map((m) => m.clone())
        return clone
    }

    dispose() {
        this.removeFromParent()
        this.geometry?.dispose()
        this.material?.forEach((m) => m.dispose())
    }

    update(elapsedMs: number) {
        this.material?.forEach((m) => m.isSequenceTextureMaterial && m.update(elapsedMs))
    }
}
