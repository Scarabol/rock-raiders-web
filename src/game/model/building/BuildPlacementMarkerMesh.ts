import { BufferGeometry, Mesh, MeshPhongMaterial, Vector2 } from 'three'
import { TILESIZE } from '../../../params'
import { SceneManager } from '../../SceneManager'
import { Surface } from '../../terrain/Surface'

export class BuildPlacementMarkerMesh extends Mesh {
    sceneMgr: SceneManager
    lastSurfaceMesh?: Mesh

    constructor(sceneMgr: SceneManager) {
        super(new BufferGeometry(), new MeshPhongMaterial({
            shininess: 0,
            transparent: true,
            opacity: 0.4,
        }))
        this.sceneMgr = sceneMgr
        this.visible = false
        this.scale.setScalar(TILESIZE)
    }

    updateMesh(worldPosition: Vector2, offset: Vector2 | undefined, heading: number = 0) {
        this.visible = !!offset
        if (!offset) return
        const posWithOffset = offset.clone().multiplyScalar(TILESIZE).rotateAround(new Vector2(0, 0), heading - Math.PI / 2).add(worldPosition)
        const surfaceMesh = this.sceneMgr.terrain.getSurfaceFromWorld2D(posWithOffset).mesh
        if (surfaceMesh === this.lastSurfaceMesh) return
        this.lastSurfaceMesh = surfaceMesh
        this.position.copy(surfaceMesh.position.clone().multiplyScalar(TILESIZE))
        this.position.y += TILESIZE / 20
        this.geometry?.dispose()
        this.geometry = surfaceMesh.geometry.clone()
    }

    setColor(hexColor: number) {
        (this.material as MeshPhongMaterial).color.setHex(hexColor)
    }

    getSurface(): Surface {
        return this.sceneMgr.terrain.getSurfaceFromWorld(this.position)
    }

    getVisibleSurface(): Surface | undefined {
        return this.visible ? this.getSurface() : undefined
    }
}
