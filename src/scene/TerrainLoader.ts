import { Surface } from './model/map/Surface';
import { Terrain } from './model/map/Terrain';
import { ResourceManager } from '../resource/ResourceManager';
import { iGet } from '../core/Util';
import { SurfaceType } from './model/map/SurfaceType';
import { WorldManager } from './WorldManager';
import { TILESIZE } from '../main';

export class TerrainLoader {

    static loadTerrain(levelConf, worldMgr: WorldManager): Terrain {
        const tileSize = Number(iGet(levelConf, 'BlockSize'));
        if (tileSize !== TILESIZE) console.error('Unexpected tile size in level configuration: ' + tileSize);
        const terrain = new Terrain(worldMgr);

        const themeName = levelConf['TextureSet'][1];
        terrain.textureSet = ResourceManager.cfg('Textures', themeName);
        // console.log(terrain.textureSet);

        const terrainMap = ResourceManager.getMap(iGet(levelConf, 'TerrainMap'));
        terrain.width = terrainMap.width;
        terrain.height = terrainMap.height;
        const pathMap = ResourceManager.getMap(iGet(levelConf, 'PathMap'));
        const surfaceMap = ResourceManager.getMap(iGet(levelConf, 'SurfaceMap')).level;
        const predugMap = ResourceManager.getMap(iGet(levelConf, 'PreDugMap')).level;
        const cryOreMap = ResourceManager.getMap(iGet(levelConf, 'CryOreMap')).level;
        // const fallinMapName = levelConf['FallinMap']; // TODO landslides

        // maps parsed from WAD are row-wise saved, which means y (row) comes first and x (column) second
        for (let r = 0; r < terrainMap.level.length; r++) {
            for (let c = 0; c < (terrainMap.level)[r].length; c++) {
                (terrain.surfaces)[c] = (terrain.surfaces)[c] || [];
                // give the path map the highest priority, if it exists
                if (pathMap && pathMap.level[r][c] !== 0) {
                    const pathMapLevel = pathMap.level[r][c];
                    if (pathMap && pathMapLevel === 1) {
                        (terrain.surfaces)[c].push(new Surface(terrain, SurfaceType.RUBBLE4, c, r, surfaceMap[r][c]));
                    } else if (pathMap && pathMapLevel === 2) {
                        (terrain.surfaces)[c].push(new Surface(terrain, SurfaceType.POWER_PATH_BUILDING, c, r, surfaceMap[r][c]));
                    } else {
                        console.error('Unexpected path map level: ' + pathMapLevel);
                    }
                } else {
                    const predugLevel = predugMap[r][c];
                    const surfaceTypeNum = (terrainMap.level)[r][c];
                    const surfaceType = SurfaceType.getByNum(surfaceTypeNum);
                    if (predugLevel === 0) {
                        (terrain.surfaces)[c].push(new Surface(terrain, surfaceType, c, r, surfaceMap[r][c]));
                    } else if (predugLevel === 1 || predugLevel === 2) {
                        if (surfaceTypeNum === 5) { // 5 with predug means GROUND, without it is SOIL
                            (terrain.surfaces)[c].push(new Surface(terrain, SurfaceType.GROUND, c, r, surfaceMap[r][c]));
                        } else {
                            (terrain.surfaces)[c].push(new Surface(terrain, surfaceType, c, r, surfaceMap[r][c]));
                        }
                    } else if (predugLevel === 3 || predugLevel === 4) { // slug holes
                        (terrain.surfaces)[c].push(new Surface(terrain, SurfaceType.SLUG_HOLE, c, r, surfaceMap[r][c]));
                    } else {
                        console.error('Unexpected predug level: ' + predugLevel);
                    }

                    const currentCryOre = cryOreMap[r][c];
                    if (currentCryOre % 2 === 1) {
                        (terrain.surfaces)[c][r].containedCrystals = (currentCryOre + 1) / 2;
                    } else {
                        (terrain.surfaces)[c][r].containedOre = currentCryOre / 2;
                    }
                }
            }
        }

        // exlpore predug surfaces
        terrain.surfaces.forEach(c => c.forEach(s => {
            if (predugMap[s.y][s.x] === 1 || predugMap[s.y][s.x] === 3) { // map are rows (y) first, columns (x) second
                for (let x = s.x - 1; x <= s.x + 1; x++) {
                    for (let y = s.y - 1; y <= s.y + 1; y++) {
                        terrain.getSurfaceOrNull(x, y).discovered = true; // TODO make all entities on this surface visible
                    }
                }
            }
        }));

        // crumble unsupported walls // TODO level12 crumbles too much
        terrain.surfaces.forEach((c) => c.forEach((s) => {
            if (!s.surfaceType.floor && !s.isSupported()) s.collapse();
        }));

        terrain.surfaces.forEach(c => c.forEach(s => s.updateMesh()));

        // TODO add landslides

        terrain.floorGroup.scale.set(tileSize, tileSize, tileSize);
        terrain.floorGroup.updateWorldMatrix(true, true); // otherwise ray intersection is not working before rendering

        return terrain;

    }

}
