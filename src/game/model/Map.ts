import * as THREE from 'three';
import { Tile } from './Tile';
import { ResourceManager } from '../../core/ResourceManager';

export class Map {

    resMgr: ResourceManager;
    width: number;
    height: number;
    textureBasename: string;
    spaces: Tile[][] = [];
    floorGroup: THREE.Group = new THREE.Group();

    constructor(resourceManager: ResourceManager, width: number, height: number, textureBasename: string) {
        this.resMgr = resourceManager;
        this.width = width;
        this.height = height;
        this.textureBasename = textureBasename;
    }

    getTile(x, y): Tile {
        if ((x >= this.width || x < 0) || (y >= this.height || y < 0)) {
            // Return an out-of-bounds tile
            return new Tile(null, x, y, null);
        } else {
            // Return the actual tile
            return this.spaces[y][x];
        }
    }

}
