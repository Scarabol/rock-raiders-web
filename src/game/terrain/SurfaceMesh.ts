import { Mesh, MeshPhongMaterial } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { SurfaceGeometry, SurfaceVertex } from './SurfaceGeometry'
import { WallType } from './WallType'
import { ObjectPointer } from '../../scene/ObjectPointer'
import { Surface } from './Surface'

export interface SurfaceMeshUserData {
    selectable?: Surface
    surface?: Surface
}

export class SurfaceMesh extends Mesh<SurfaceGeometry, MeshPhongMaterial> {
    declare userData: SurfaceMeshUserData
    objectPointer?: ObjectPointer // Only available for surfaces with tuto block id

    constructor(x: number, y: number, userData: SurfaceMeshUserData) {
        super(new SurfaceGeometry(), new MeshPhongMaterial({shininess: 0}))
        this.position.set(x, 0, y)
        this.userData = userData
    }

    setHighlightColor(hex: number) {
        this.material.color.setHex(hex)
    }

    setTexture(textureFilepath: string, textureRotation: number) {
        this.material.map?.dispose()
        this.material.map = ResourceManager.getSurfaceTexture(textureFilepath, textureRotation) ?? null
        this.material.needsUpdate = true
    }

    setHeights(wallType: WallType, topLeft: SurfaceVertex, topRight: SurfaceVertex, bottomRight: SurfaceVertex, bottomLeft: SurfaceVertex) {
        this.geometry.setHeights(wallType, topLeft, topRight, bottomRight, bottomLeft)
    }

    dispose() {
        this.removeFromParent()
        this.geometry.dispose()
        this.material.dispose()
    }
}
