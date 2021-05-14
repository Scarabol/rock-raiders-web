import { Mesh } from 'three'
import { clearIntervalSafe } from '../core/Util'

export class SceneMesh {

    mesh: Mesh = null
    textureSequences = []

    constructor(mesh: Mesh, textureSequences: any[]) {
        this.mesh = mesh
        this.textureSequences = textureSequences
    }

    dispose() {
        this.textureSequences.forEach((s) => clearIntervalSafe(s))
        this.mesh.geometry.dispose()
        Array.isArray(this.mesh.material) ? this.mesh.material.forEach(mat => mat.dispose()) : this.mesh.material?.dispose()
    }

}
