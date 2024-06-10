import { Mesh, MeshPhongMaterial } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { SurfaceGeometry, SurfaceVertex } from './SurfaceGeometry'
import { WALL_TYPE } from './WallType'
import { ObjectPointer } from '../../scene/ObjectPointer'

export class SurfaceMesh extends Mesh {
    readonly geometry: SurfaceGeometry = new SurfaceGeometry()
    readonly material: MeshPhongMaterial = new MeshPhongMaterial({shininess: 0})
    objectPointer?: ObjectPointer // Only available for surfaces with tuto block id

    constructor(x: number, y: number, userData: any) {
        super()
        this.position.set(x, 0, y)
        this.userData = userData
    }

    setHighlightColor(hex: number) {
        this.material.color.setHex(hex)
    }

    setTexture(textureFilepath: string, textureRotation: number) {
        const texture = ResourceManager.getTexture(textureFilepath)
        if (!texture) { // ice has no lava erosion textures
            console.warn(`Could not find texture '${textureFilepath}'`)
            return
        }
        texture.center.set(0.5, 0.5)
        texture.rotation = textureRotation
        if (this.material.map) this.material.map.dispose()
        this.material.map = texture
        this.material.needsUpdate = true
    }

    setHeights(wallType: WALL_TYPE, topLeft: SurfaceVertex, topRight: SurfaceVertex, bottomRight: SurfaceVertex, bottomLeft: SurfaceVertex) {
        this.geometry.setHeights(wallType, topLeft, topRight, bottomRight, bottomLeft)
    }

    dispose() {
        this.geometry.dispose()
        this.material.dispose()
    }
}
