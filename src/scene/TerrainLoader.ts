import { Surface } from './model/map/Surface'
import { Terrain } from './model/map/Terrain'
import { ResourceManager } from '../resource/ResourceManager'
import { iGet } from '../core/Util'
import { SurfaceType } from './model/map/SurfaceType'
import { WorldManager } from './WorldManager'
import { TILESIZE } from '../main'

export class TerrainLoader {

    static loadTerrain(levelConf, worldMgr: WorldManager): Terrain {
        const tileSize = Number(iGet(levelConf, 'BlockSize'))
        if (tileSize !== TILESIZE) console.error('Unexpected tile size in level configuration: ' + tileSize)
        const terrain = new Terrain(worldMgr)

        const themeName = levelConf['TextureSet'][1]
        terrain.textureSet = ResourceManager.cfg('Textures', themeName)
        // console.log(terrain.textureSet);

        const terrainMap = ResourceManager.getMap(iGet(levelConf, 'TerrainMap'))
        terrain.width = terrainMap.width
        terrain.height = terrainMap.height
        const pathMap = ResourceManager.getMap(iGet(levelConf, 'PathMap'))?.level
        const surfaceMap = ResourceManager.getMap(iGet(levelConf, 'SurfaceMap'))?.level
        const predugMap = ResourceManager.getMap(iGet(levelConf, 'PreDugMap'))?.level
        const cryOreMap = ResourceManager.getMap(iGet(levelConf, 'CryOreMap'))?.level
        const fallinMap = ResourceManager.getMap(iGet(levelConf, 'FallinMap'))?.level
        const erodeMap = ResourceManager.getMap(iGet(levelConf, 'ErodeMap'))?.level

        // maps parsed from WAD are row-wise saved, which means y (row) comes first and x (column) second
        for (let r = 0; r < terrainMap.level.length; r++) {
            for (let c = 0; c < (terrainMap.level)[r].length; c++) {
                (terrain.surfaces)[c] = (terrain.surfaces)[c] || []
                const surfaceTypeNum = (terrainMap.level)[r][c]
                let surfaceType = SurfaceType.getByNum(surfaceTypeNum)
                const predugLevel = predugMap[r][c]
                if (predugLevel === PredugMap.CAVERN_EXPOSED) {
                    if (surfaceType === SurfaceType.GROUND || surfaceType === SurfaceType.DIRT) {
                        surfaceType = SurfaceType.GROUND
                    } else if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA) {
                        console.warn('Unexpected cavern surface type: ' + surfaceType.name)
                    }
                } else if (predugLevel === PredugMap.SLUG_HOLE_EXPOSED || predugLevel === PredugMap.SLUG_HOLE_HIDDEN) {
                    surfaceType = SurfaceType.SLUG_HOLE
                } else if (predugLevel !== PredugMap.WALL && predugLevel !== PredugMap.CAVERN_HIDDEN) {
                    console.warn('Unexpected predug level: ' + predugLevel)
                }
                // give the path map the highest priority, if it exists
                const pathMapLevel = pathMap && surfaceType.floor ? pathMap[r][c] : PathMap.NONE
                if (pathMapLevel === PathMap.RUBBLE) {
                    surfaceType = SurfaceType.RUBBLE4
                } else if (pathMapLevel === PathMap.POWER_PATH) {
                    surfaceType = SurfaceType.POWER_PATH
                } else if (pathMapLevel !== PathMap.NONE) {
                    console.warn('Unexpected path map level: ' + pathMapLevel)
                }

                const surface = new Surface(terrain, surfaceType, c, r, surfaceMap[r][c])
                if (cryOreMap) {
                    const currentCryOre = cryOreMap[r][c]
                    if (currentCryOre % 2 === 1) {
                        surface.containedCrystals = (currentCryOre + 1) / 2
                    } else {
                        surface.containedOres = currentCryOre / 2
                    }
                }

                (terrain.surfaces)[c].push(surface)
            }
        }

        // exlpore predug surfaces
        terrain.surfaces.forEach(c => c.forEach(s => {
            if (predugMap[s.y][s.x] === PredugMap.CAVERN_EXPOSED || predugMap[s.y][s.x] === PredugMap.SLUG_HOLE_EXPOSED) { // map are rows (y) first, columns (x) second
                for (let x = s.x - 1; x <= s.x + 1; x++) {
                    for (let y = s.y - 1; y <= s.y + 1; y++) {
                        terrain.getSurfaceOrNull(x, y).discovered = true
                    }
                }
            }
        }))

        // create hidden caverns
        terrain.surfaces.forEach(c => c.forEach(s => {
            const surface = terrain.getSurfaceOrNull(s.x, s.y)
            if (predugMap[s.y][s.x] === PredugMap.CAVERN_HIDDEN && !surface.discovered) {
                surface.surfaceType = SurfaceType.GROUND
            }
        }))

        // crumble unsupported walls
        terrain.surfaces.forEach((c) => c.forEach((s) => {
            if (!s.isSupported()) s.collapse()
        }))

        terrain.updateSurfaceMeshes(true)

        if (fallinMap) {
            for (let x = 0; x < terrain.width; x++) {
                for (let y = 0; y < terrain.height; y++) {
                    terrain.getSurface(x, y).setFallinLevel(fallinMap[y][x]) // rows (y) before columns (x) used in maps
                }
            }
        }

        if (erodeMap) { // TODO implement lava erosion
            console.warn('Lucky you! Lava erosion not yet implemented')
        }

        return terrain
    }

}

enum PathMap {

    NONE = 0,
    RUBBLE = 1,
    POWER_PATH = 2,

}

enum PredugMap {

    WALL = 0,
    CAVERN_EXPOSED = 1,
    CAVERN_HIDDEN = 2,
    SLUG_HOLE_EXPOSED = 3,
    SLUG_HOLE_HIDDEN = 4,
}
