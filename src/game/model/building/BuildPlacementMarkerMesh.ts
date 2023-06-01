import { BufferGeometry, Mesh, MeshPhongMaterial, Vector2 } from 'three'
import { TILESIZE } from '../../../params'
import { SceneManager } from '../../SceneManager'
import { Surface } from '../../terrain/Surface'

export class BuildPlacementMarkerMesh extends Mesh {
    sceneMgr: SceneManager
    standardColor: number
    lastSurfaceMesh: Mesh

    constructor(sceneMgr: SceneManager, standardColor: number) {
        super(new BufferGeometry(), new MeshPhongMaterial({
            shininess: 0,
            transparent: true,
            opacity: 0.4,
            color: standardColor,
        }))
        this.sceneMgr = sceneMgr
        this.standardColor = standardColor
        this.visible = false
        this.scale.setScalar(TILESIZE)
    }

    updateMesh(worldPosition: Vector2, offset: Vector2, heading: number = 0) {
        this.visible = !!offset
        if (!this.visible) return
        const posWithOffset = offset.clone().multiplyScalar(TILESIZE).rotateAround(new Vector2(0, 0), heading - Math.PI / 2).add(worldPosition)
        const surfaceMesh = this.sceneMgr.terrain.getSurfaceFromWorld2D(posWithOffset).mesh
        if (surfaceMesh === this.lastSurfaceMesh) return
        this.lastSurfaceMesh = surfaceMesh
        this.position.copy(surfaceMesh.position.clone().multiplyScalar(TILESIZE))
        this.position.y += TILESIZE / 20
        this.geometry?.dispose()
        this.geometry = surfaceMesh.geometry.clone()
    }

    markAsValid(isValid: boolean) {
        const color = isValid ? this.standardColor : 0x500000;
        (this.material as MeshPhongMaterial).color.setHex(color)
    }

    get surface(): Surface {
        return this.visible ? this.sceneMgr.terrain.getSurfaceFromWorld(this.position) : null
    }
}
