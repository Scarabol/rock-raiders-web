import { Surface } from '../model/Surface';
import { Terrain } from '../model/Terrain';

export class TerrainLoader {

    loadTerrain(resMgr, levelConf): Terrain {
        const terrain = new Terrain(resMgr);

        const themeName = levelConf['TextureSet'][1];
        terrain.textureSet = resMgr.configuration['Lego*']['Textures'][themeName];
        // console.log(terrain.textureSet);

        const terrainMap = resMgr.maps[(levelConf)['TerrainMap']];
        terrain.width = terrainMap.width;
        terrain.height = terrainMap.height;
        const pathMap = resMgr.maps[(levelConf)['PathMap']];
        const surfaceMap = resMgr.maps[(levelConf)['SurfaceMap']].level;
        const predugMap = resMgr.maps[(levelConf)['PreDugMap']].level;
        const cryOreMap = resMgr.maps[(levelConf)['CryOreMap']].level;
        // const fallinMapName = levelConf['FallinMap']; // TODO landslides

        for (let x = 0; x < terrainMap.level.length; x++) {
            terrain.surfaces.push([]);
            for (let y = 0; y < (terrainMap.level)[x].length; y++) {
                // give the path map the highest priority, if it exists
                if (pathMap && pathMap.level[x][y] === 1) {
                    // rubble 1 space id = 100
                    (terrain.surfaces)[x].push(new Surface(terrain, 100, x, y, surfaceMap[x][y]));
                } else if (pathMap && pathMap.level[x][y] === 2) {
                    // building power path space id = -1
                    (terrain.surfaces)[x].push(new Surface(terrain, -1, x, y, surfaceMap[x][y]));
                } else {
                    if (predugMap[x][y] === 0) {
                        // soil(5) was removed pre-release, so replace it with dirt(4)
                        if ((terrainMap.level)[x][y] === 5) {
                            (terrain.surfaces)[x].push(new Surface(terrain, 4, x, y, surfaceMap[x][y]));
                        } else {
                            (terrain.surfaces)[x].push(new Surface(terrain, (terrainMap.level)[x][y], x, y, surfaceMap[x][y]));
                        }
                    } else if (predugMap[x][y] === 3 || predugMap[x][y] === 4) { // slug holes
                        (terrain.surfaces)[x].push(new Surface(terrain, predugMap[x][y] * 10, x, y, surfaceMap[x][y]));
                    } else if (predugMap[x][y] === 1 || predugMap[x][y] === 2) {
                        if ((terrainMap.level)[x][y] === 6) {
                            (terrain.surfaces)[x].push(new Surface(terrain, 6, x, y, surfaceMap[x][y]));
                        } else if ((terrainMap.level)[x][y] === 9) {
                            (terrain.surfaces)[x].push(new Surface(terrain, 9, x, y, surfaceMap[x][y]));
                        } else {
                            (terrain.surfaces)[x].push(new Surface(terrain, 0, x, y, surfaceMap[x][y]));
                        }
                    }

                    const currentCryOre = cryOreMap[x][y];
                    if (currentCryOre % 2 === 1) {
                        (terrain.surfaces)[x][y].containedCrystals = (currentCryOre + 1) / 2;
                    } else {
                        (terrain.surfaces)[x][y].containedOre = currentCryOre / 2;
                    }
                }
            }
        }
        // console.log(terrain.surfaces);

        // TODO crumble unsupported walls (this may change discover result in next step)

        // exlpore predug surfaces
        terrain.surfaces.forEach(c => c.forEach(s => {
            if (predugMap[s.x][s.y] === 1 || predugMap[s.x][s.y] === 3) {
                for (let x = s.x - 1; x <= s.x + 1; x++) {
                    for (let y = s.y - 1; y <= s.y + 1; y++) {
                        s.terrain.getSurface(x, y).discovered = true;
                    }
                }
            }
        }));
        terrain.surfaces.forEach(c => c.forEach(s => s.updateMesh()));

        // TODO add landslides

        return terrain;

    }

}
