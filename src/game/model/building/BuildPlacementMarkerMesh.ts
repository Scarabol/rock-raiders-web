import { BufferGeometry, Mesh, MeshPhongMaterial, Vector2 } from 'three'
import { TILESIZE } from '../../../params'
import { SceneManager } from '../../SceneManager'
import { Surface } from '../../terrain/Surface'
import { SurfaceMesh } from '../../terrain/SurfaceMesh'

export class BuildPlacementMarkerMesh extends Mesh<BufferGeometry, MeshPhongMaterial> {
    sceneMgr: SceneManager
    lastSurfaceMesh: SurfaceMesh | undefined

    constructor(sceneMgr: SceneManager) {
        super(new BufferGeometry(), new MeshPhongMaterial({
            shininess: 0,
            transparent: true,
            opacity: 0.4,
        }))
        this.sceneMgr = sceneMgr
        this.visible = false
    }

    updateMesh(worldPosition: Vector2, offset: Vector2 | undefined, heading: number = 0) {
        this.visible = !!offset
        if (!offset) return
        const posWithOffset = offset.clone().multiplyScalar(TILESIZE).rotateAround(new Vector2(0, 0), heading - Math.PI / 2).add(worldPosition)
        const surfaceMesh = this.sceneMgr.terrain.getSurfaceFromWorld2D(posWithOffset).mesh
        if (surfaceMesh === this.lastSurfaceMesh) return
        this.lastSurfaceMesh = surfaceMesh
        surfaceMesh.lowMesh.getWorldPosition(this.position)
        this.position.y += TILESIZE / 20
        this.geometry?.dispose()
        this.geometry = surfaceMesh.lowMesh.geometry.clone()
    }

    setColor(hexColor: number) {
        this.material.color.setHex(hexColor)
    }

    getSurface(): Surface {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.position)
    }

    getVisibleSurface(): Surface | undefined {
        return this.visible ? this.getSurface() : undefined
    }
}
