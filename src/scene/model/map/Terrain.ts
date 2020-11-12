import { Group, Vector3 } from 'three';
import { Surface } from './Surface';
import { WorldManager } from '../../WorldManager';
import { SurfaceType } from './SurfaceType';

export class Terrain {

    worldMgr: WorldManager;
    textureSet: any = {};
    width: number = 0;
    height: number = 0;
    surfaces: Surface[][] = [];
    floorGroup: Group = new Group();
    roofGroup: Group = new Group();

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr;
        this.roofGroup.visible = false; // keep roof hidden unless switched to other camera
    }

    getSurfaceFromWorld(worldPosition: Vector3) {
        return this.getSurface(worldPosition.x / WorldManager.TILESIZE, worldPosition.z / WorldManager.TILESIZE);
    }

    getSurface(x, y): Surface {
        x = Math.floor(x);
        y = Math.floor(y);
        return this.getSurfaceOrNull(x, y) || new Surface(this, SurfaceType.SOLID_ROCK, x, y, 0);
    }

    getSurfaceOrNull(x, y): Surface {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.surfaces[x][y];
        } else {
            return null;
        }
    }

}
