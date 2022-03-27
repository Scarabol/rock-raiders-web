import { Mesh } from 'three'
import { SequenceTextureMaterial } from './SequenceTextureMaterial'

export class SceneMesh extends Mesh {
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
        this.getMaterials().forEach((m) => m.type === 'MeshPhongMaterial' && m.update(elapsedMs)) // TODO why is there a MeshBasicMaterial in this list???
    }
}
