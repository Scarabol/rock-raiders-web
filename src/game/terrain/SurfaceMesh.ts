import { BackSide, BufferGeometry, Group, Mesh, MeshPhongMaterial, Texture, Vector3 } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { SurfaceGeometry, SurfaceVertex } from './SurfaceGeometry'
import { WALL_TYPE, WallType } from './WallType'
import { ObjectPointer } from '../../scene/ObjectPointer'
import { Surface } from './Surface'
import { TILESIZE } from '../../params'
import { SequenceTextureMaterial } from '../../scene/SequenceTextureMaterial'

export interface SurfaceMeshUserData {
    selectable?: Surface
    surface?: Surface
}

export class SurfaceMesh extends Group {
    proMeshEnabled: boolean = false
    lowMesh: SurfaceMeshLow
    objectPointer?: ObjectPointer // Only available for surfaces with tuto block id
    proMesh?: SurfaceMeshPro

    constructor(readonly x: number, readonly y: number, readonly userData: SurfaceMeshUserData) {
        super()
        this.lowMesh = new SurfaceMeshLow(x, y, userData)
        this.add(this.lowMesh)
    }

    setProMeshEnabled(state: boolean) {
        this.proMeshEnabled = state
        if (this.proMesh) this.proMesh.visible = this.proMeshEnabled
        this.lowMesh.visible = !this.proMesh?.visible
    }

    setHighlightColor(hex: number) {
        this.lowMesh.setHighlightColor(hex)
        this.proMesh?.material.forEach((m) => m.color.setHex(hex))
    }

    setTexture(textureFilepath: string, textureRotation: number) {
        this.lowMesh.setTexture(textureFilepath, textureRotation)
    }

    updateProMesh(proMeshFilepath: string) {
        const surface = this.userData.surface!
        // TODO Keep the shape of the surface separately
        const adjacent = surface.terrain.getAdjacent(this.x, this.y)
        const topLeftVertex = surface.getVertex(this.x, this.y, adjacent.left, adjacent.topLeft, adjacent.top)
        const topRightVertex = surface.getVertex(this.x + 1, this.y, adjacent.top, adjacent.topRight, adjacent.right)
        const bottomRightVertex = surface.getVertex(this.x + 1, this.y + 1, adjacent.right, adjacent.bottomRight, adjacent.bottom)
        const bottomLeftVertex = surface.getVertex(this.x, this.y + 1, adjacent.bottom, adjacent.bottomLeft, adjacent.left)
        if (this.proMesh) {
            this.remove(this.proMesh)
            this.proMesh.dispose()
            this.proMesh = undefined
        }
        if (surface.wallType === WALL_TYPE.corner || surface.wallType === WALL_TYPE.wall || surface.wallType === WALL_TYPE.invertedCorner ||
            (surface.wallType === WALL_TYPE.floor && surface.hasRubble())) {
            this.proMesh = ResourceManager.proMeshes.get(proMeshFilepath)?.clone(true)
            if (!this.proMesh) console.warn(`Could not find surface pro mesh for "${proMeshFilepath}"`)
        }
        if (this.proMesh) {
            this.proMesh.userData = this.userData
            const wallAngle = SurfaceMesh.getWallAngle(surface.wallType, topLeftVertex.high, topRightVertex.high, bottomRightVertex.high, bottomLeftVertex.high)
            this.proMesh.rotation.y = wallAngle
            const posY = (topLeftVertex.offset + topRightVertex.offset + bottomRightVertex.offset + bottomLeftVertex.offset) / 4
            this.proMesh.position.set(this.x + 0.5, posY, this.y + 0.5).multiplyScalar(TILESIZE)
            this.add(this.proMesh)
            // Tear pro mesh to fit surface map offsets and close gaps in terrain
            const rotationIndex = (Math.round(wallAngle / (Math.PI / 2)) + 8) % 4
            SurfaceMesh.tearGeometryPositionsByVertexOffsets(this.proMesh.geometry, topLeftVertex.offset, bottomLeftVertex.offset, bottomRightVertex.offset, topRightVertex.offset, rotationIndex)
        }
        if (this.proMesh) this.proMesh.visible = this.proMeshEnabled
        this.lowMesh.visible = !this.proMesh?.visible
    }

    private static getWallAngle(wallType: WallType, topLeftHigh: boolean, topRightHigh: boolean, bottomRightHigh: boolean, bottomLeftHigh: boolean): number {
        switch (wallType) {
            case WALL_TYPE.corner:
                if (topLeftHigh) return Math.PI / 2
                else if (bottomLeftHigh) return Math.PI
                else if (bottomRightHigh) return -Math.PI / 2
                return 0
            case WALL_TYPE.invertedCorner:
                if (!topLeftHigh) return -Math.PI / 2
                else if (!bottomLeftHigh) return 0
                else if (!bottomRightHigh) return Math.PI / 2
                return Math.PI
            case WALL_TYPE.wall:
                if (topLeftHigh && topRightHigh) return 0
                else if (topLeftHigh && bottomLeftHigh) return Math.PI / 2
                else if (topRightHigh && bottomRightHigh) return -Math.PI / 2
                else return Math.PI
        }
        return 0
    }

    private static tearGeometryPositionsByVertexOffsets(geo: BufferGeometry, topLeftOffset: number, bottomLeftOffset: number, bottomRightOffset: number, topRightOffset: number, rotationIndex: number) {
        const geoPos = geo.getAttribute('position')
        if (geoPos.itemSize !== 3) console.warn(`Unexpected item size (${geoPos.itemSize}) given; expected 3 instead`)
        const frontLeft = new Vector3(100, 0, 100)
        const backLeft = new Vector3(100, 0, -100)
        const frontRight = new Vector3(-100, 0, 100)
        const backRight = new Vector3(-100, 0, -100)
        const nearThreshold = 5
        for (let c = 1; c < geoPos.array.length; c += 3) {
            const x = geoPos.array[c - 1]
            const y = geoPos.array[c]
            const z = geoPos.array[c + 1]
            if (z < frontLeft.z - nearThreshold || (Math.abs(z - frontLeft.z) <= nearThreshold && x < frontLeft.x - nearThreshold)) {
                frontLeft.set(x, y, z)
            }
            if (z > backLeft.z + nearThreshold || (Math.abs(z - backLeft.z) <= nearThreshold && x < backLeft.x - nearThreshold)) {
                backLeft.set(x, y, z)
            }
            if (z < frontRight.z - nearThreshold || (Math.abs(z - frontRight.z) <= nearThreshold && x > frontRight.x + nearThreshold)) {
                frontRight.set(x, y, z)
            }
            if (z > backRight.z + nearThreshold || (Math.abs(z - backRight.z) <= nearThreshold && x > backRight.x + nearThreshold)) {
                backRight.set(x, y, z)
            }
        }
        const nearTopLeft = []
        const nearBottomLeft = []
        const nearBottomRight = []
        const nearTopRight = []
        const nearOthers = []
        for (let c = 1; c < geoPos.array.length; c += geoPos.itemSize) {
            const x = geoPos.array[c - 1]
            const y = geoPos.array[c]
            const z = geoPos.array[c + 1]
            if (Math.abs(x - frontLeft.x) < nearThreshold && Math.abs(y - frontLeft.y) < nearThreshold && Math.abs(z - frontLeft.z) < nearThreshold) {
                nearTopLeft.push({x, y, z, index: c})
            } else if (Math.abs(x - backLeft.x) < nearThreshold && Math.abs(y - backLeft.y) < nearThreshold && Math.abs(z - backLeft.z) < nearThreshold) {
                nearBottomLeft.push({x, y, z, index: c})
            } else if (Math.abs(x - backRight.x) < nearThreshold && Math.abs(y - backRight.y) < nearThreshold && Math.abs(z - backRight.z) < nearThreshold) {
                nearBottomRight.push({x, y, z, index: c})
            } else if (Math.abs(x - frontRight.x) < nearThreshold && Math.abs(y - frontRight.y) < nearThreshold && Math.abs(z - frontRight.z) < nearThreshold) {
                nearTopRight.push({x, y, z, index: c})
            } else {
                nearOthers.push({x, y, z, index: c})
            }
        }
        const offset = [topLeftOffset, bottomLeftOffset, bottomRightOffset, topRightOffset]
        const posY = offset.reduce((p, c) => p + c, 0) / offset.length
        nearTopLeft.forEach((e) => {
            geoPos.array[e.index] += (offset[rotationIndex] - posY) * TILESIZE
        })
        nearBottomLeft.forEach((e) => {
            geoPos.array[e.index] += (offset[(rotationIndex + 1) % 4] - posY) * TILESIZE
        })
        nearBottomRight.forEach((e) => {
            geoPos.array[e.index] += (offset[(rotationIndex + 2) % 4] - posY) * TILESIZE
        })
        nearTopRight.forEach((e) => {
            geoPos.array[e.index] += (offset[(rotationIndex + 3) % 4] - posY) * TILESIZE
        })
        const avgFrontLeft = this.avgVec(nearTopLeft)
        const avgBackLeft = this.avgVec(nearBottomLeft)
        const avgFrontRight = this.avgVec(nearTopRight)
        nearOthers.forEach((point) => {
            const dx = avgFrontRight.x - avgFrontLeft.x
            const dz = avgBackLeft.z - avgFrontLeft.z
            if (dx === 0 || dz === 0) return
            const t1 = (point.x - avgFrontLeft.x) / dx
            const t2 = (point.z - avgFrontLeft.z) / dz
            const yOffset = (1 - t1) * (1 - t2) * offset[rotationIndex] +
                t1 * (1 - t2) * offset[(rotationIndex + 3) % 4] +
                (1 - t1) * t2 * offset[(rotationIndex + 1) % 4] +
                t1 * t2 * offset[(rotationIndex + 2) % 4]
            geoPos.array[point.index] += (yOffset - posY) * TILESIZE
        })
        geo.setAttribute('position', geoPos)
    }

    private static avgVec(vecList: { x: number, y: number, z: number }[]): { x: number, y: number, z: number } {
        const avgVec = vecList.reduce((p, c) => ({x: p.x + c.x, y: p.y + c.y, z: p.z + c.z}), {x: 0, y: 0, z: 0})
        avgVec.x /= vecList.length
        avgVec.y /= vecList.length
        avgVec.z /= vecList.length
        return avgVec
    }

    setHeights(wallType: WallType, topLeft: SurfaceVertex, topRight: SurfaceVertex, bottomRight: SurfaceVertex, bottomLeft: SurfaceVertex) {
        this.lowMesh.setHeights(wallType, topLeft, topRight, bottomRight, bottomLeft)
    }

    dispose() {
        this.removeFromParent()
        this.lowMesh.dispose()
        this.proMesh?.dispose()
    }
}

class SurfaceMeshLow extends Mesh<SurfaceGeometry, MeshPhongMaterial> {
    declare userData: SurfaceMeshUserData

    constructor(x: number, y: number, userData: SurfaceMeshUserData) {
        super(new SurfaceGeometry(), new MeshPhongMaterial({shininess: 0}))
        this.position.set(x, 0, y).multiplyScalar(TILESIZE)
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

export class SurfaceMeshPro extends Mesh<BufferGeometry, SequenceTextureMaterial[]> {
    clone(recursive?: boolean): this {
        const clone = super.clone(recursive)
        clone.geometry = this.geometry.clone()
        clone.material = clone.material.map((m) => m.clone())
        return clone
    }

    dispose() {
        this.removeFromParent()
        this.geometry?.dispose()
        this.material?.forEach((m) => m.dispose())
    }
}

export class RoofMesh extends Mesh<SurfaceGeometry, MeshPhongMaterial> {
    constructor(x: number, y: number, texture: Texture | null) { // three.js uses null instead of undefined
        super(new SurfaceGeometry(), new MeshPhongMaterial({shininess: 0, side: BackSide, map: texture}))
        this.position.set(x, 3, y).multiplyScalar(TILESIZE)
    }

    setHeights(wallType: WallType, topLeft: SurfaceVertex, topRight: SurfaceVertex, bottomRight: SurfaceVertex, bottomLeft: SurfaceVertex) {
        this.geometry.setHeights(wallType, topLeft.flipY(), topRight.flipY(), bottomRight.flipY(), bottomLeft.flipY())
    }

    dispose() {
        this.removeFromParent()
        this.geometry.dispose()
        this.material.dispose()
    }
}
