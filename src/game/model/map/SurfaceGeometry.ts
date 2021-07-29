import { BufferGeometry, Vector2, Vector3 } from 'three'
import { BufferAttribute } from 'three/src/core/BufferAttribute'
import { WALL_TYPE } from './WallType'

export class SurfaceGeometry {
    public static create(wallType: WALL_TYPE,
                         topLeftVertex: Vector3, topRightVertex: Vector3, bottomRightVertex: Vector3, bottomLeftVertex: Vector3,
                         topLeftHeight: number, topRightHeight: number, bottomRightHeight: number, bottomLeftHeight: number,
    ) {
        let uvOffset = 0

        // not-rotated
        // 1 ?
        // ? 0
        if (topLeftVertex.y && !bottomRightVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(topRightVertex.y)))) {
            uvOffset = 0
        }

        // 90 clock-wise
        // ? 1
        // 0 ?
        if (topRightVertex.y && !bottomLeftVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(bottomRightVertex.y)))) {
            uvOffset = 3
        }

        // 180 clock-wise
        // 0 ?
        // ? 1
        if (bottomRightVertex.y && !topLeftVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(bottomLeftVertex.y)))) {
            uvOffset = 2
        }

        // 270 clock-wise
        // ? 0
        // 1 ?
        if (bottomLeftVertex.y && !topRightVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(topLeftVertex.y)))) {
            uvOffset = 1
        }

        if (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) {
            if (topLeftVertex.y && bottomRightVertex.y) {
                uvOffset = 0
            }
            if (topRightVertex.y && bottomLeftVertex.y) {
                uvOffset = 3
            }
        }

        /*
        //		0---1                1         0---1
        //		|   |  becomes      /|   and   |  /
        //		|   |             /  |         |/
        //		3---2            3---2         3
        //
        //		OR
        //
        //		0---1            0             0---1
        //		|   |  becomes   |\    	 and    \  |
        //		|   |            |  \             \|
        //		3---2            3---2             2
        //
        //		Triangles 0-1-3 and 0-3-2
        //		Quad 0-1-3-2
        */

        const uv = [
            new Vector2(0, 1),
            new Vector2(1, 1),
            new Vector2(1, 0),
            new Vector2(0, 0),
        ]

        const bufferVertices = []
        const bufferNormals = []

        function addFaceAndNormals(a, b, c) {
            bufferVertices.push(a, b, c)
            const normal = new Vector3().subVectors(c, b)
            normal.cross(new Vector3().subVectors(a, b))
            normal.normalize()
            bufferNormals.push(normal, normal, normal)
        }

        const uvIndexes = []
        if (topRightVertex.y !== bottomLeftVertex.y ||
            ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) && !(topRightVertex.y && bottomLeftVertex.y))) {
            uvIndexes.push(1, 3, 2)
            uvIndexes.push(1, 0, 3)

            // apply height fine-tuning
            topLeftVertex.y = topLeftHeight
            topRightVertex.y = topRightHeight
            bottomRightVertex.y = bottomRightHeight
            bottomLeftVertex.y = bottomLeftHeight

            addFaceAndNormals(topRightVertex, bottomLeftVertex, bottomRightVertex)
            addFaceAndNormals(topRightVertex, topLeftVertex, bottomLeftVertex)
        } else {
            uvIndexes.push(0, 3, 2)
            uvIndexes.push(0, 2, 1)

            // apply height fine-tuning
            topLeftVertex.y = topLeftHeight
            topRightVertex.y = topRightHeight
            bottomRightVertex.y = bottomRightHeight
            bottomLeftVertex.y = bottomLeftHeight

            addFaceAndNormals(topLeftVertex, bottomLeftVertex, bottomRightVertex)
            addFaceAndNormals(topLeftVertex, bottomRightVertex, topRightVertex)
        }

        const bufferVertexUvs = uvIndexes.map(i => uv[(i + uvOffset) % 4])

        const bufferGeometry = new BufferGeometry()
        bufferGeometry.setAttribute('position', new BufferAttribute(new Float32Array(18), 3).copyVector3sArray(bufferVertices))
        bufferGeometry.setAttribute('normal', new BufferAttribute(new Float32Array(18), 3).copyVector3sArray(bufferNormals))
        bufferGeometry.setAttribute('uv', new BufferAttribute(new Float32Array(12), 2).copyVector2sArray(bufferVertexUvs))
        return bufferGeometry
    }
}
