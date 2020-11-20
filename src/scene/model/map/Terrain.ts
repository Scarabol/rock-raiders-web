import { Group, Vector3 } from 'three';
import { Surface } from './Surface';
import { WorldManager } from '../../WorldManager';
import { SurfaceType } from './SurfaceType';
import { TILESIZE } from '../../../main';
import { EventBus } from '../../../event/EventBus';
import { EntityAddedEvent, EntityType } from '../../../event/WorldEvents';
import { BuildingEntity } from '../BuildingEntity';

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
        EventBus.registerEventListener(EntityAddedEvent.eventKey, (event: EntityAddedEvent) => {
            if (event.type !== EntityType.BUILDING) return;
            (event.entity as BuildingEntity).surfaces.forEach((bSurf) => {
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        this.getSurface(bSurf.x + x, bSurf.y + y).updateTexture();
                    }
                }
            });
        });
    }

    getSurfaceFromWorld(worldPosition: Vector3): Surface | null {
        return this.getSurface(worldPosition.x / TILESIZE, worldPosition.z / TILESIZE);
    }

    getSurface(x, y): Surface {
        x = Math.floor(x);
        y = Math.floor(y);
        return this.getSurfaceOrNull(x, y) || new Surface(this, SurfaceType.SOLID_ROCK, x, y, 0);
    }

    getSurfaceOrNull(x, y): Surface | null {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.surfaces[x][y];
        } else {
            return null;
        }
    }

}
