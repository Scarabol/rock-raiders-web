import * as THREE from 'three';
import { Surface } from './Surface';
import { ResourceManager } from '../../core/ResourceManager';

export class Terrain {

    resMgr: ResourceManager;
    textureSet: any = {};
    width: number = 0;
    height: number = 0;
    surfaces: Surface[][] = [];
    floorGroup: THREE.Group = new THREE.Group();
    roofGroup: THREE.Group = new THREE.Group();

    constructor(resourceManager: ResourceManager) {
        this.resMgr = resourceManager;
        this.roofGroup.visible = false; // keep roof hidden unless switched to other camera
    }

    getSurface(x, y): Surface {
        return this.surfaces[x][y];
    }

}
