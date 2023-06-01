import { BufferGeometry, Vector2, Vector3 } from 'three'
import { BufferAttribute } from 'three/src/core/BufferAttribute'
import { WALL_TYPE } from './WallType'

export class SurfaceGeometry extends BufferGeometry {
    constructor() {
        super()
        this.setAttribute('position', new BufferAttribute(new Float32Array(18), 3))
        this.setAttribute('normal', new BufferAttribute(new Float32Array(18), 3))
        this.setAttribute('uv', new BufferAttribute(new Float32Array(12), 2))
    }

    setHeights(wallType: WALL_TYPE, topLeft: SurfaceVertex, topRight: SurfaceVertex, bottomRight: SurfaceVertex, bottomLeft: SurfaceVertex) {
        const uvOffset = SurfaceGeometry.determineUvOffset(wallType, topLeft.high, bottomRight.high, topRight.high, bottomLeft.high)

        const topLeftVertex = new Vector3(0, topLeft.height, 0)
        const topRightVertex = new Vector3(1, topRight.height, 0)
        const bottomRightVertex = new Vector3(1, bottomRight.height, 1)
        const bottomLeftVertex = new Vector3(0, bottomLeft.height, 1)

        const vertices: Vector3[] = []
        const normals: Vector3[] = []

        function addFaceAndNormals(a: Vector3, b: Vector3, c: Vector3) {
            vertices.push(a, b, c)
            const normal = new Vector3().subVectors(c, b)
            normal.cross(new Vector3().subVectors(a, b))
            normal.normalize()
            normals.push(normal, normal, normal)
        }

        const uvIndexes = []
        if (topRight.high !== bottomLeft.high ||
            (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) && !(topRight.high && bottomLeft.high)) {
            uvIndexes.push(1, 3, 2)
            uvIndexes.push(1, 0, 3)
            addFaceAndNormals(topRightVertex, bottomLeftVertex, bottomRightVertex)
            addFaceAndNormals(topRightVertex, topLeftVertex, bottomLeftVertex)
        } else {
            uvIndexes.push(0, 3, 2)
            uvIndexes.push(0, 2, 1)
            addFaceAndNormals(topLeftVertex, bottomLeftVertex, bottomRightVertex)
            addFaceAndNormals(topLeftVertex, bottomRightVertex, topRightVertex)
        }

        const uv = [
            new Vector2(0, 1),
            new Vector2(1, 1),
            new Vector2(1, 0),
            new Vector2(0, 0),
        ]
        const vertexUvs = uvIndexes.map(i => uv[(i + uvOffset) % 4])
        this.setAttributes(vertices, normals, vertexUvs)
    }

    private static determineUvOffset(wallType: WALL_TYPE, topLeftHigh: boolean, bottomRightHigh: boolean, topRightHigh: boolean, bottomLeftHigh: boolean) {
        let uvOffset = 0
        // not-rotated
        // 1 ?
        // ? 0
        if (topLeftHigh && !bottomRightHigh &&
            (wallType === WALL_TYPE.INVERTED_CORNER || (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === (topRightHigh))) {
            uvOffset = 0
        }
        // 90 clock-wise
        // ? 1
        // 0 ?
        if (topRightHigh && !bottomLeftHigh &&
            (wallType === WALL_TYPE.INVERTED_CORNER || (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === (bottomRightHigh))) {
            uvOffset = 3
        }
        // 180 clock-wise
        // 0 ?
        // ? 1
        if (bottomRightHigh && !topLeftHigh &&
            (wallType === WALL_TYPE.INVERTED_CORNER || (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === (bottomLeftHigh))) {
            uvOffset = 2
        }
        // 270 clock-wise
        // ? 0
        // 1 ?
        if (bottomLeftHigh && !topRightHigh &&
            (wallType === WALL_TYPE.INVERTED_CORNER || (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === (topLeftHigh))) {
            uvOffset = 1
        }
        if (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) {
            if (topLeftHigh && bottomRightHigh) {
                uvOffset = 0
            }
            if (topRightHigh && bottomLeftHigh) {
                uvOffset = 3
            }
        }
        return uvOffset
    }

    private setAttributes(vertices: Vector3[], normals: Vector3[], vertexUvs: Vector2[]) {
        const positionAttribute = this.attributes.position as BufferAttribute
        SurfaceGeometry.copyVectorsToBuffer(positionAttribute, vertices, 3)
        const normalAttribute = this.attributes.normal as BufferAttribute
        SurfaceGeometry.copyVectorsToBuffer(normalAttribute, normals, 3)
        const uvAttribute = this.attributes.uv as BufferAttribute
        SurfaceGeometry.copyVectorsToBuffer(uvAttribute, vertexUvs, 2)
        this.computeBoundingBox()
        this.computeBoundingSphere()
    }

    private static copyVectorsToBuffer(bufferAttribute: BufferAttribute, vectors: Vector2[] | Vector3[], dimensions: number) {
        const array = bufferAttribute.array as number[]
        let offset = 0
        for (let i = 0, l = vectors.length; i < l; i++) {
            vectors[i].toArray(array, offset)
            offset += dimensions
        }
        bufferAttribute.needsUpdate = true
    }
}

export class SurfaceVertex {
    highNum: number
    height: number

    constructor(readonly high: boolean, readonly offset: number) {
        this.highNum = Number(this.high)
        this.height = this.highNum + this.offset
    }
}
