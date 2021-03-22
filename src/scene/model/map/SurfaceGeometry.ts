import { BufferGeometry, Vector2, Vector3 } from "three";
import { WALL_TYPE } from "./Surface";
import { BufferAttribute } from "three/src/core/BufferAttribute";

export class SurfaceGeometry {

    public static create(wallType: WALL_TYPE, topLeftVertex: Vector3, bottomRightVertex: Vector3, topRightVertex: Vector3, bottomLeftVertex: Vector3) {
        let uvOffset = 0;

        // not-rotated
        // 1 ?
        // ? 0
        if (topLeftVertex.y && !bottomRightVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(topRightVertex.y)))) {
            uvOffset = 0;
        }

        // 90 clock-wise
        // ? 1
        // 0 ?
        if (topRightVertex.y && !bottomLeftVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(bottomRightVertex.y)))) {
            uvOffset = 3;
        }

        // 180 clock-wise
        // 0 ?
        // ? 1
        if (bottomRightVertex.y && !topLeftVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(bottomLeftVertex.y)))) {
            uvOffset = 2;
        }

        // 270 clock-wise
        // ? 0
        // 1 ?
        if (bottomLeftVertex.y && !topRightVertex.y &&
            (wallType === WALL_TYPE.INVERTED_CORNER || ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) === Boolean(topLeftVertex.y)))) {
            uvOffset = 1;
        }

        if (wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) {
            if (topLeftVertex.y && bottomRightVertex.y) {
                uvOffset = 0;
            }
            if (topRightVertex.y && bottomLeftVertex.y) {
                uvOffset = 3;
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
        ];

        const bufferVertices = [];
        const bufferNormals = [];
        const bufferVertexUvs = [];

        function addFaceAndNormals(a, b, c) {
            bufferVertices.push(a, b, c);
            const normal = new Vector3().subVectors(c, b);
            normal.cross(new Vector3().subVectors(a, b));
            normal.normalize();
            bufferNormals.push(normal, normal, normal);
        }

        if (topRightVertex.y !== bottomLeftVertex.y ||
            ((wallType === WALL_TYPE.WALL || wallType === WALL_TYPE.WEIRD_CREVICE) && !(topRightVertex.y && bottomLeftVertex.y))) {
            bufferVertexUvs.push(
                uv[(1 + uvOffset) % 4],
                uv[(3 + uvOffset) % 4],
                uv[(2 + uvOffset) % 4],
            );

            // noinspection PointlessArithmeticExpressionJS
            bufferVertexUvs.push(
                uv[(1 + uvOffset) % 4],
                uv[(0 + uvOffset) % 4],
                uv[(3 + uvOffset) % 4],
            );

            addFaceAndNormals(topRightVertex, bottomLeftVertex, bottomRightVertex);
            addFaceAndNormals(topRightVertex, topLeftVertex, bottomLeftVertex);
        } else {
            // noinspection PointlessArithmeticExpressionJS
            bufferVertexUvs.push(
                uv[(0 + uvOffset) % 4],
                uv[(3 + uvOffset) % 4],
                uv[(2 + uvOffset) % 4],
            );

            // noinspection PointlessArithmeticExpressionJS
            bufferVertexUvs.push(
                uv[(0 + uvOffset) % 4],
                uv[(2 + uvOffset) % 4],
                uv[(1 + uvOffset) % 4],
            );

            addFaceAndNormals(topLeftVertex, bottomLeftVertex, bottomRightVertex);
            addFaceAndNormals(topLeftVertex, bottomRightVertex, topRightVertex);
        }

        const bufferGeometry = new BufferGeometry();
        bufferGeometry.setAttribute('position', new BufferAttribute(new Float32Array(18), 3).copyVector3sArray(bufferVertices));
        bufferGeometry.setAttribute('normal', new BufferAttribute(new Float32Array(18), 3).copyVector3sArray(bufferNormals));
        bufferGeometry.setAttribute('uv', new BufferAttribute(new Float32Array(12), 2).copyVector2sArray(bufferVertexUvs));
        return bufferGeometry;
    }
}
