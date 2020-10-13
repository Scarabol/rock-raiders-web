import * as THREE from 'three';
import { Map } from './Map';
import { SceneUtils } from 'three/examples/jsm/utils/SceneUtils';
import { Texture } from 'three/src/textures/Texture';
import { ImageLoader } from 'three/src/loaders/ImageLoader';
import { RGBAFormat, RGBFormat } from 'three/src/constants';

// CONSTANTS
const HEIGHT_MULTIPLER = 0.05;

// SURF TYPES
const SURF = {
    GROUND: 0,
    SOLID_ROCK: 1,
    HARD_ROCK: 2,
    LOOSE_ROCK: 3,
    DIRT: 4,
    SOIL: 5,
    LAVA: 6,
    ORE_SEAM: 8,
    WATER: 9,
    CRYSTAL_SEAM: 10,
    RECHARGE_SEAM: 11,
};

export class Tile {

    type: any;
    x: number;
    y: number;
    surface: any;
    map: Map;

    geometry: THREE.Geometry = null;
    texture: any = null;
    mesh: THREE.Object3D = null;

    surf: any = 1;
    high: any = 0;
    undiscovered: any = false;

    health: any = -1;

    constructor(type, x, y, surface) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.surface = surface;
    }

    isSolid() {
        return ((this.surf !== SURF.GROUND) &&
            (this.surf !== SURF.WATER) &&
            (this.surf !== SURF.LAVA)) ||
            (this.undiscovered);
    }

    explore() {
        if (this.undiscovered) {
            this.undiscovered = false;
            const n = this.getAllNeighbors();
            for (let property in n) {
                if (n.hasOwnProperty(property)) {
                    n[property].update();
                }
            }
        }
    }

    collapse() {
        if (this.isSolid()) {
            this.surf = SURF.GROUND;
            this.update();
            this.iterateProperties(this.getAllNeighbors(), function (neighbor) {
                neighbor.update();
            });
        }
    }

    iterateProperties(object, func) {
        for (let property in object) {
            if (object.hasOwnProperty(property)) {
                func(object[property]);
            }
        }
    }

    getY(x, z) {
        const raycaster = new THREE.Raycaster();
        raycaster.set(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0)); // TODO scale with tile size
        const intersect = raycaster.intersectObjects(this.mesh.children, true);

        return intersect[0].point.y;
    }

    getAllNeighbors() {
        return {
            'top': this.map.getTile(this.x, this.y - 1),
            'right': this.map.getTile(this.x + 1, this.y),
            'bottom': this.map.getTile(this.x, this.y + 1),
            'left': this.map.getTile(this.x - 1, this.y),
            'topLeft': this.map.getTile(this.x - 1, this.y - 1),
            'topRight': this.map.getTile(this.x + 1, this.y - 1),
            'bottomRight': this.map.getTile(this.x + 1, this.y + 1),
            'bottomLeft': this.map.getTile(this.x - 1, this.y + 1),
        };
    }

    update() {
        const n = this.getAllNeighbors();
        // console.log(n);

        let isSurrounded = true;
        for (let property in n) {
            if (n.hasOwnProperty(property)) {
                isSurrounded = isSurrounded && n[property].isSolid();
            }
        }

        if (isSurrounded) {
            this.undiscovered = true;
        } else {
            this.explore();
        }

        const topLeftVertex = new THREE.Vector3(this.x, 0, this.y);
        const topRightVertex = new THREE.Vector3(this.x + 1, 0, this.y);
        const bottomLeftVertex = new THREE.Vector3(this.x, 0, this.y + 1);
        const bottomRightVertex = new THREE.Vector3(this.x + 1, 0, this.y + 1);

        if (this.isSolid()) {
            if (n.topLeft && n.topLeft.isSolid() && (n.top.isSolid() && n.left.isSolid())) {
                topLeftVertex.y = 1;
            }

            if (n.topRight && n.topRight.isSolid() && (n.top.isSolid() && n.right.isSolid())) {
                topRightVertex.y = 1;
            }

            if (n.bottomRight && n.bottomRight.isSolid() && (n.bottom.isSolid() && n.right.isSolid())) {
                bottomRightVertex.y = 1;
            }

            if (n.bottomLeft && n.bottomLeft.isSolid() && (n.bottom.isSolid() && n.left.isSolid())) {
                bottomLeftVertex.y = 1;
            }
        }

        // WALL-TYPES
        // 1: CORNER
        // 2: WEIRD-CREVICE or FLAT-WALL
        // 3: INVERTED-CORNER

        const wallType = topLeftVertex.y + topRightVertex.y + bottomRightVertex.y + bottomLeftVertex.y;
        if (wallType === 0) this.surf = SURF.GROUND;
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

        let textureName = this.map.textureBasename;
        let textureIndex = -1;

        if (this.undiscovered) { // FIXME determine texture name
            textureName += '70';
        } else {
            console.log('discovered!');
            textureName += '00';
        }
        //     if (wallType === 1) {
        //         textureIndex = 2;
        //     } else if (wallType === 3) {
        //         textureIndex = 1;
        //     } else if (wallType === 2 && (topLeftVertex.y === bottomRightVertex.y)) {
        //         textureName += '77';
        //     } else {
        //         textureIndex = 0;
        //     }
        textureName += '.bmp';

        // if (textureIndex !== -1) textureName += this.map.tileTypes[this.surf].textures[textureIndex];
        // console.log(textureName);
        const textureImage = this.map.resMgr.getImage(textureName).canvas;
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

        if (this.mesh) this.map.floorGroup.remove(this.mesh);
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

        topLeftVertex.y = (topLeftVertex.y * 1.0) + (this.high * HEIGHT_MULTIPLER);
        topRightVertex.y = (topRightVertex.y * 1.0) + (n.right.high * HEIGHT_MULTIPLER);
        bottomRightVertex.y = (bottomRightVertex.y * 1.0) + (n.bottomRight.high * HEIGHT_MULTIPLER);
        bottomLeftVertex.y = (bottomLeftVertex.y * 1.0) + (n.bottom.high * HEIGHT_MULTIPLER);

        this.geometry.computeFaceNormals();
        this.geometry.computeVertexNormals();

        this.mesh = SceneUtils.createMultiMaterialObject(this.geometry, [
            new THREE.MeshPhongMaterial({map: this.texture, shininess: 0}),
            //new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true} )
        ]);

        this.mesh.userData = {parent: this};
        this.map.floorGroup.add(this.mesh);
    }
}
