import * as THREE from 'three';
import { Terrain } from './Terrain';
import { SceneUtils } from 'three/examples/jsm/utils/SceneUtils';
import { Texture } from 'three/src/textures/Texture';
import { RGBFormat } from 'three/src/constants';
import { DIRT, GROUND, HARD_ROCK, SOLID_ROCK, SURF_TO_TYPE, SurfaceType } from './SurfaceType';

// // CONSTANTS
// const HEIGHT_MULTIPLER = 0.05;

// // SURF TYPES
// const SURF = {
//     GROUND: 0,
//     SOLID_ROCK: 1,
//     HARD_ROCK: 2,
//     LOOSE_ROCK: 3,
//     DIRT: 4,
//     SOIL: 5,
//     LAVA: 6,
//     ORE_SEAM: 8,
//     WATER: 9,
//     CRYSTAL_SEAM: 10,
//     RECHARGE_SEAM: 11,
// };

export class Surface {

    terrain: Terrain;
    surfaceType: SurfaceType;
    x: number;
    y: number;
    containedOre: number = 0;
    containedCrystals: number = 0;
    heightOffset: number = 0;

    geometry: THREE.Geometry = null;
    texture: any = null;
    mesh: THREE.Object3D = null;

    // surface: any = 1;
    // high: any = 0;
    // undiscovered: any = false;

    discovered: boolean = false;

    constructor(terrain, surface, x, y, high) {
        this.terrain = terrain;
        this.surfaceType = SURF_TO_TYPE[surface];
        this.x = x;
        this.y = y;
        // this.high = high; // TODO apply high with scaling
    }

    // isFloor() {
    //     return ((this.surface !== SURF.GROUND) &&
    //         (this.surface !== SURF.WATER) &&
    //         (this.surface !== SURF.LAVA)) ||
    //         (this.undiscovered);
    // }

    // explore() {
    //     if (this.undiscovered) {
    //         this.undiscovered = false;
    //         const n = this.getAllNeighbors();
    //         for (let property in n) {
    //             if (n.hasOwnProperty(property)) {
    //                 n[property].update();
    //             }
    //         }
    //     }
    // }

    // collapse() {
    //     if (this.isFloor()) {
    //         this.surface = SURF.GROUND;
    //         this.update();
    //         this.iterateProperties(this.getAllNeighbors(), function (neighbor) {
    //             neighbor.update();
    //         });
    //     }
    // }

    // iterateProperties(object, func) {
    //     for (let property in object) {
    //         if (object.hasOwnProperty(property)) {
    //             func(object[property]);
    //         }
    //     }
    // }

    // getY(x, z) {
    //     const raycaster = new THREE.Raycaster();
    //     raycaster.set(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0)); // TODO scale with tile size
    //     const intersect = raycaster.intersectObjects(this.mesh.children, true);
    //
    //     return intersect[0].point.y;
    // }

    // getAllNeighbors() {
    //     return {
    //         'top': this.map.getSurface(this.x, this.y - 1),
    //         'right': this.map.getSurface(this.x + 1, this.y),
    //         'bottom': this.map.getSurface(this.x, this.y + 1),
    //         'left': this.map.getSurface(this.x - 1, this.y),
    //         'topLeft': this.map.getSurface(this.x - 1, this.y - 1),
    //         'topRight': this.map.getSurface(this.x + 1, this.y - 1),
    //         'bottomRight': this.map.getSurface(this.x + 1, this.y + 1),
    //         'bottomLeft': this.map.getSurface(this.x - 1, this.y + 1),
    //     };
    // }

    updateMesh() {
        if (this.mesh) this.terrain.floorGroup.remove(this.mesh);

    //     const n = this.getAllNeighbors();
    //     // console.log(n);
    //
    //     let isSurrounded = true;
    //     for (let property in n) {
    //         if (n.hasOwnProperty(property)) {
    //             isSurrounded = isSurrounded && n[property].isSolid();
    //         }
    //     }
    //
    //     if (isSurrounded) {
    //         // this.undiscovered = true;
    //     } else {
    //         this.explore();
    //     }

        const topLeftVertex = new THREE.Vector3(this.x, 0, this.y);
        const topRightVertex = new THREE.Vector3(this.x + 1, 0, this.y);
        const bottomLeftVertex = new THREE.Vector3(this.x, 0, this.y + 1);
        const bottomRightVertex = new THREE.Vector3(this.x + 1, 0, this.y + 1);

    //     if (this.isFloor()) {
    //         if (n.topLeft.isFloor() && (n.top.isFloor() && n.left.isFloor())) {
    //             topLeftVertex.y = 1;
    //         }
    //
    //         if (n.topRight.isFloor() && (n.top.isFloor() && n.right.isFloor())) {
    //             topRightVertex.y = 1;
    //         }
    //
    //         if (n.bottomRight.isFloor() && (n.bottom.isFloor() && n.right.isFloor())) {
    //             bottomRightVertex.y = 1;
    //         }
    //
    //         if (n.bottomLeft.isFloor() && (n.bottom.isFloor() && n.left.isFloor())) {
    //             bottomLeftVertex.y = 1;
    //         }
    //     }

        // WALL-TYPES
        // 1: CORNER
        // 2: WEIRD-CREVICE or FLAT-WALL
        // 3: INVERTED-CORNER

        const wallType = topLeftVertex.y + topRightVertex.y + bottomRightVertex.y + bottomLeftVertex.y;
        // if (wallType === 0) this.surfaceType = .GROUND;
        let uvOffset = 0;

        // not-rotated
        // 1 ?
        // ? 0
        if (topLeftVertex.y && !bottomRightVertex.y && (wallType === 3 || ((wallType === 2) === Boolean(topRightVertex.y)))) {
            uvOffset = 0;
        }

        // 90 clock-wise
        // ? 1
        // 0 ?
        if (topRightVertex.y && !bottomLeftVertex.y && (wallType === 3 || ((wallType === 2) === Boolean(bottomRightVertex.y)))) {
            uvOffset = 3;
        }

        // 180 clock-wise
        // 0 ?
        // ? 1
        if (bottomRightVertex.y && !topLeftVertex.y && (wallType === 3 || ((wallType === 2) === Boolean(bottomLeftVertex.y)))) {
            uvOffset = 2;
        }

        // 270 clock-wise
        // ? 0
        // 1 ?
        if (bottomLeftVertex.y && !topRightVertex.y && (wallType === 3 || ((wallType === 2) === Boolean(topLeftVertex.y)))) {
            uvOffset = 1;
        }

        if (wallType === 2) {
            if (topLeftVertex.y && bottomRightVertex.y) {
                uvOffset = 0;
            }
            if (topRightVertex.y && bottomLeftVertex.y) {
                uvOffset = 3;
            }
        }

        let textureName = this.terrain.textureSet.texturebasename;
        console.log(textureName);

        let shapeIndex = 0;
        if (!this.discovered) {
            shapeIndex = 7;
        } else { // FIXME complete list
            // console.log(wallType);
        }
        // if (wallType === 1) {
        //     shapeIndex = 2;
        // } else if (wallType === 3) {
        //     shapeIndex = 1;
        // } else if (wallType === 2 && (topLeftVertex.y === bottomRightVertex.y)) {
        //     textureName += '77';
        // } else {
        //     shapeIndex = 0;
        // }
        textureName += shapeIndex.toString();

        let materialIndex = 0;
        if (!this.discovered) { // FIXME determine texture name
            materialIndex = 0;
        } else if (this.surfaceType === GROUND) {
            materialIndex = 0;
        } else if (this.surfaceType === SOLID_ROCK) {
            materialIndex = 5;
        } else if (this.surfaceType === HARD_ROCK) {
            materialIndex = 4;
        } else if (this.surfaceType === DIRT) {
            materialIndex = 1;
        } else {
            console.log(this.surfaceType);
        }
        textureName += materialIndex.toString();

        textureName += '.bmp';

        // if (textureIndex !== -1) textureName += this.map.tileTypes[this.surface].textures[textureIndex];
        // console.log(textureName);
        const textureImage = this.terrain.resMgr.getImage(textureName).canvas;
        // console.log(textureImage);
        const texture = new Texture();
        texture.image = textureImage;
        // texture.format = isJPEG ? RGBFormat : RGBAFormat;
        texture.format = RGBFormat;
        texture.needsUpdate = true;
        // console.log(this.map.textureBasename);
        // this.texture = this.tm.load(textureName);
        this.texture = texture;
        this.texture.flipY = false; // TODO is this needed?

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

        if (this.mesh) this.terrain.floorGroup.remove(this.mesh);
        if (this.geometry) this.geometry.dispose();
        this.geometry = new THREE.Geometry();

        this.geometry.vertices.push(
            topLeftVertex,
            topRightVertex,
            bottomRightVertex,
            bottomLeftVertex,
        );

        const uv = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1),
        ];

        if (topRightVertex.y !== bottomLeftVertex.y ||
            (wallType === 2 && !(topRightVertex.y && bottomLeftVertex.y))) {
            this.geometry.faceVertexUvs[0].push([
                uv[(1 + uvOffset) % 4],
                uv[(3 + uvOffset) % 4],
                uv[(2 + uvOffset) % 4],
            ]);

            this.geometry.faceVertexUvs[0].push([
                uv[(1 + uvOffset) % 4],
                uv[(0 + uvOffset) % 4],
                uv[(3 + uvOffset) % 4],
            ]);

            this.geometry.faces.push(
                new THREE.Face3(1, 3, 2),
                new THREE.Face3(1, 0, 3),
            );
        } else {
            this.geometry.faceVertexUvs[0].push([
                uv[(0 + uvOffset) % 4],
                uv[(3 + uvOffset) % 4],
                uv[(2 + uvOffset) % 4],
            ]);

            this.geometry.faceVertexUvs[0].push([
                uv[(0 + uvOffset) % 4],
                uv[(2 + uvOffset) % 4],
                uv[(1 + uvOffset) % 4],
            ]);

            this.geometry.faces.push(
                new THREE.Face3(0, 3, 2),
                new THREE.Face3(0, 2, 1),
            );
        }

    //     topLeftVertex.y = (topLeftVertex.y * 1.0) + (this.high * HEIGHT_MULTIPLER);
    //     topRightVertex.y = (topRightVertex.y * 1.0) + (n.right.high * HEIGHT_MULTIPLER);
    //     bottomRightVertex.y = (bottomRightVertex.y * 1.0) + (n.bottomRight.high * HEIGHT_MULTIPLER);
    //     bottomLeftVertex.y = (bottomLeftVertex.y * 1.0) + (n.bottom.high * HEIGHT_MULTIPLER);

        this.geometry.computeFaceNormals();
        this.geometry.computeVertexNormals();

        this.mesh = SceneUtils.createMultiMaterialObject(this.geometry, [
            new THREE.MeshPhongMaterial({map: this.texture, shininess: 0}),
            //new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true} )
        ]);

        // this.mesh.userData = {parent: this};
        this.terrain.floorGroup.add(this.mesh);
    }
}
