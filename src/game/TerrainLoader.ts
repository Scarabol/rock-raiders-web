import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { TILESIZE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { EntityManager } from './EntityManager'
import { Surface } from './model/map/Surface'
import { SurfaceType } from './model/map/SurfaceType'
import { Terrain } from './model/map/Terrain'
import { SceneManager } from './SceneManager'

export class TerrainLoader {
    static loadTerrain(levelConf: LevelEntryCfg, sceneMgr: SceneManager, entityMgr: EntityManager) {
        const tileSize = levelConf.blockSize
        if (tileSize !== TILESIZE) console.error(`Unexpected tile size in level configuration: ${tileSize}`)
        const terrain = new Terrain(sceneMgr, entityMgr)

        const themeName = levelConf.textureSet[1]
        terrain.textureSet = ResourceManager.cfg('Textures', themeName)
        // console.log(terrain.textureSet);

        const terrainMap = ResourceManager.getResource(levelConf.terrainMap)
        terrain.width = terrainMap.width
        terrain.height = terrainMap.height
        const pathMap = ResourceManager.getResource(levelConf.pathMap)?.level
        const surfaceMap = ResourceManager.getResource(levelConf.surfaceMap)?.level
        const predugMap = ResourceManager.getResource(levelConf.predugMap)?.level
        const cryOreMap = ResourceManager.getResource(levelConf.cryOreMap)?.level
        const fallinMap = ResourceManager.getResource(levelConf.fallinMap)?.level
        const erodeMap = ResourceManager.getResource(levelConf.erodeMap)?.level
        const blockMap = ResourceManager.getResource(levelConf.blockPointersMap)?.level

        // maps parsed from WAD are row-wise saved, which means y (row) comes first and x (column) second
        for (let r = 0; r < terrainMap.level.length; r++) {
            for (let c = 0; c < (terrainMap.level)[r].length; c++) {
                (terrain.surfaces)[c] = (terrain.surfaces)[c] || []
                const surfaceTypeNum = (terrainMap.level)[r][c]
                let surfaceType = SurfaceType.getByNum(surfaceTypeNum)
                const predugLevel = predugMap[r][c]
                if (predugLevel === PredugMap.CAVERN_EXPOSED) {
                    if (surfaceType === SurfaceType.GROUND || surfaceType === SurfaceType.DIRT
                        || surfaceType === SurfaceType.SOLID_ROCK || surfaceType === SurfaceType.HARD_ROCK // as seen in level 14
                        || surfaceType === SurfaceType.POWER_PATH_BUILDING) { // used by mods
                        surfaceType = SurfaceType.GROUND
                    } else if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA) {
                        console.warn(`Unexpected cavern surface type: ${surfaceType.name}`)
                    }
                } else if (predugLevel === PredugMap.SLUG_HOLE_EXPOSED || predugLevel === PredugMap.SLUG_HOLE_HIDDEN) {
                    surfaceType = SurfaceType.SLUG_HOLE
                } else if (predugLevel !== PredugMap.WALL && predugLevel !== PredugMap.CAVERN_HIDDEN) {
                    console.warn(`Unexpected predug level: ${predugLevel}`)
                }
                // give the path map the highest priority, if it exists
                const pathMapLevel = pathMap && surfaceType.floor ? pathMap[r][c] : PathMap.NONE
                if (pathMapLevel === PathMap.RUBBLE) {
                    surfaceType = SurfaceType.RUBBLE4
                } else if (pathMapLevel === PathMap.POWER_PATH) {
                    surfaceType = SurfaceType.POWER_PATH
                } else if (pathMapLevel !== PathMap.NONE) {
                    console.warn(`Unexpected path map level: ${pathMapLevel}`)
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

        // explore pre-dug surfaces
        terrain.forEachSurface((s) => {
            if (predugMap[s.y][s.x] === PredugMap.CAVERN_EXPOSED || predugMap[s.y][s.x] === PredugMap.SLUG_HOLE_EXPOSED) { // map are rows (y) first, columns (x) second
                for (let x = s.x - 1; x <= s.x + 1; x++) {
                    for (let y = s.y - 1; y <= s.y + 1; y++) {
                        terrain.getSurfaceOrNull(x, y).discovered = true
                    }
                }
            }
        })

        // create hidden caverns
        terrain.forEachSurface((s) => {
            const surface = terrain.getSurfaceOrNull(s.x, s.y)
            if (predugMap[s.y][s.x] === PredugMap.CAVERN_HIDDEN && !surface.discovered && !surface.surfaceType.floor) {
                surface.surfaceType = SurfaceType.GROUND
            }
        })

        // generate path finding weights
        terrain.pathFinder.initWeights(terrain)

        // crumble unsupported walls
        terrain.forEachSurface((s) => {
            if (!s.isSupported()) s.collapse() // TODO this should happen right after mission briefing is done
        })

        terrain.updateSurfaceMeshes(true)

        if (fallinMap) {
            for (let x = 0; x < terrain.width; x++) {
                for (let y = 0; y < terrain.height; y++) {
                    terrain.setFallinLevel(x, y, fallinMap[y][x]) // rows (y) before columns (x) used in maps
                }
            }
        }

        if (erodeMap) { // TODO implement lava erosion
            console.warn('Lucky you! Lava erosion not yet implemented')
        }

        if (blockMap) { // TODO implement tutorial blocks map
            // console.log(blockMap)
        }
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
