import { BufferGeometry, Mesh } from 'three'
import { SequenceTextureMaterial } from './SequenceTextureMaterial'

export class SceneMesh extends Mesh<BufferGeometry, SequenceTextureMaterial[]> {
    constructor(geometry?: BufferGeometry, material?: SequenceTextureMaterial[], name?: string) {
        super(geometry, material ?? [])
        this.name = name ?? ''
    }

    dispose() {
        this.removeFromParent()
        // do not dispose geometries since they're handled as singletons to save memory
        this.material?.forEach((m) => m.dispose())
    }

    update(elapsedMs: number) {
        this.material?.forEach((m) => m.isSequenceTextureMaterial && m.update(elapsedMs))
    }
}
