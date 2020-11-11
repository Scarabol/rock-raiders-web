import { Surface } from './model/map/Surface';
import { Terrain } from './model/map/Terrain';
import { ResourceManager } from '../resource/ResourceManager';
import { iGet } from '../core/Util';

export class TerrainLoader {

    static loadTerrain(levelConf): Terrain {
        // const tileSize = Number(iGet(levelConf, 'BlockSize'));
        const terrain = new Terrain();

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
                if (pathMap && pathMap.level[r][c] === 1) {
                    // rubble 1 space id = 100
                    (terrain.surfaces)[c].push(new Surface(terrain, 100, c, r, surfaceMap[r][c]));
                } else if (pathMap && pathMap.level[r][c] === 2) {
                    // building power path space id = -1
                    (terrain.surfaces)[c].push(new Surface(terrain, -1, c, r, surfaceMap[r][c]));
                } else {
                    if (predugMap[r][c] === 0) {
                        // soil(5) was removed pre-release, so replace it with dirt(4)
                        if ((terrainMap.level)[r][c] === 5) {
                            (terrain.surfaces)[c].push(new Surface(terrain, 4, c, r, surfaceMap[r][c]));
                        } else {
                            (terrain.surfaces)[c].push(new Surface(terrain, (terrainMap.level)[r][c], c, r, surfaceMap[r][c]));
                        }
                    } else if (predugMap[r][c] === 3 || predugMap[r][c] === 4) { // slug holes
                        (terrain.surfaces)[c].push(new Surface(terrain, predugMap[r][c] * 10, c, r, surfaceMap[r][c]));
                    } else if (predugMap[r][c] === 1 || predugMap[r][c] === 2) {
                        if ((terrainMap.level)[r][c] === 6) {
                            (terrain.surfaces)[c].push(new Surface(terrain, 6, c, r, surfaceMap[r][c]));
                        } else if ((terrainMap.level)[r][c] === 9) {
                            (terrain.surfaces)[c].push(new Surface(terrain, 9, c, r, surfaceMap[r][c]));
                        } else {
                            (terrain.surfaces)[c].push(new Surface(terrain, 0, c, r, surfaceMap[r][c]));
                        }
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
            if (predugMap[s.y][s.x] === 1 || predugMap[s.y][s.x] === 3) { // predug map is rows (y) first, columns (x) second
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

        return terrain;

    }

}
