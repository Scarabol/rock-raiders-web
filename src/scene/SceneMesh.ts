import { BufferGeometry, Mesh } from 'three'
import { SceneManager } from '../game/SceneManager'
import { SequenceTextureMaterial } from './SequenceTextureMaterial'

export class SceneMesh extends Mesh {

    constructor(geometry?: BufferGeometry, materials?: SequenceTextureMaterial[]) {
        super(geometry, materials)
        SceneManager.registerMesh(this)
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
        const mat = this.material
        if (!mat) return []
        return (Array.isArray(mat) ? mat : [mat]) as SequenceTextureMaterial[]
    }

}
