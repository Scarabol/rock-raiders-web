import { LevelConfData } from './LevelLoader'
import { TILESIZE } from '../params'
import { Surface } from './terrain/Surface'
import { SurfaceType } from './terrain/SurfaceType'
import { Terrain } from './terrain/Terrain'
import { WorldManager } from './WorldManager'
import { Vector3 } from 'three'
import { LavaErosionComponent } from './component/LavaErosionComponent'
import { GameConfig } from '../cfg/GameConfig'
import { EmergeComponent } from './component/EmergeComponent'
import { FallInComponent } from './component/FallInComponent'
import { FluidSurfaceComponent } from './component/FluidSurfaceComponent'
import { isNum } from '../core/Util'
import { PRNG } from './factory/PRNG'
import { WALL_TYPE } from './terrain/WallType'
import { SlugHoleComponent } from './component/SlugHoleComponent'

export class TerrainLoader {
    static loadTerrain(levelConf: LevelConfData, worldMgr: WorldManager): Terrain {
        const terrain = new Terrain(worldMgr, levelConf)

        // maps parsed from WAD are row-wise saved, which means y (row) comes first and x (column) second
        for (let r = 0; r < levelConf.terrainMap.length; r++) {
            for (let c = 0; c < levelConf.terrainMap[r].length; c++) {
                terrain.surfaces[c] = terrain.surfaces[c] || []
                const surfaceTypeNum = levelConf.terrainMap[r][c]
                let surfaceType = SurfaceType.getByNum(surfaceTypeNum)
                const predugLevel = levelConf.predugMap[r][c]
                if (predugLevel === PREDUG_MAP.cavernExposed) {
                    if (surfaceType === SurfaceType.GROUND || surfaceType === SurfaceType.DIRT
                        || surfaceType === SurfaceType.SOLID_ROCK || surfaceType === SurfaceType.HARD_ROCK || surfaceType === SurfaceType.LOOSE_ROCK) {
                        surfaceType = SurfaceType.GROUND
                    } else if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA5) {
                        console.warn(`Unexpected cavern surface type: ${surfaceType.name}`)
                    }
                } else if (predugLevel === PREDUG_MAP.slugHoleExposed || predugLevel === PREDUG_MAP.slugHoleHidden) {
                    surfaceType = SurfaceType.SLUG_HOLE
                } else if (predugLevel !== PREDUG_MAP.wall && predugLevel !== PREDUG_MAP.cavernHidden) {
                    console.warn(`Unexpected predug level: ${predugLevel}`)
                }
                // give the path map the highest priority, if it exists
                const pathMapLevel = levelConf.pathMap && surfaceType.floor ? levelConf.pathMap[r][c] : PATH_MAP.none
                if (pathMapLevel === PATH_MAP.rubble) {
                    surfaceType = SurfaceType.RUBBLE4
                } else if (pathMapLevel === PATH_MAP.powerPath) {
                    surfaceType = SurfaceType.POWER_PATH
                } else if (pathMapLevel !== PATH_MAP.none) {
                    console.warn(`Unexpected path map level: ${pathMapLevel}`)
                }

                const surface = new Surface(terrain, surfaceType, c, r)
                if (levelConf.cryOreMap) {
                    const currentCryOre = levelConf.cryOreMap[r][c]
                    if (currentCryOre % 2 === 1) {
                        surface.containedCrystals = (currentCryOre + 1) / 2
                    } else {
                        surface.containedOres = currentCryOre / 2
                    }
                }

                terrain.surfaces[c].push(surface)
            }
        }

        // calculate average height offsets
        for (let x = 0; x < terrain.width + 1; x++) {
            terrain.heightOffset[x] = []
            for (let y = 0; y < terrain.height + 1; y++) {
                const offsets = [levelConf.surfaceMap?.[y - 1]?.[x - 1], levelConf.surfaceMap?.[y - 1]?.[x], levelConf.surfaceMap?.[y]?.[x - 1], levelConf.surfaceMap?.[y]?.[x]].filter((n) => isNum(n))
                terrain.heightOffset[x][y] = offsets.reduce((l, r) => l + r, 0) / (offsets.length || 1) * 0.1 / 6 * levelConf.roughLevel
            }
        }

        // explore pre-dug surfaces
        terrain.forEachSurface((s) => {
            if (levelConf.predugMap[s.y][s.x] === PREDUG_MAP.cavernExposed || levelConf.predugMap[s.y][s.x] === PREDUG_MAP.slugHoleExposed) { // map are rows (y) first, columns (x) second
                for (let x = s.x - 1; x <= s.x + 1; x++) {
                    for (let y = s.y - 1; y <= s.y + 1; y++) {
                        const surface = terrain.getSurfaceOrNull(x, y)
                        if (surface) {
                            surface.discovered = true
                            if (surface.neighbors.some((n) => n.surfaceType.floor)) {
                                switch (surface.surfaceType) {
                                    case SurfaceType.LAVA5:
                                    // fallthrough
                                    case SurfaceType.WATER:
                                        worldMgr.ecs.addComponent(surface.entity, new FluidSurfaceComponent(surface.x, surface.y, surface.mesh.lowMesh.geometry.attributes['uv']))
                                        break
                                    case SurfaceType.SLUG_HOLE:
                                        worldMgr.ecs.addComponent(surface.entity, new SlugHoleComponent(surface.x, surface.y))
                                        break
                                    case SurfaceType.RECHARGE_SEAM:
                                        terrain.rechargeSeams.add(surface)
                                        const floorNeighbor = surface.neighbors.find((n) => n.surfaceType.floor)
                                        if (floorNeighbor) { // TODO Same code as in surface class
                                            const position = new Vector3(0.5, 0.5 + surface.terrain.getHeightOffset(surface.x, surface.y), 0.5)
                                            const angle = Math.atan2(floorNeighbor.y - surface.y, surface.x - floorNeighbor.x) + Math.PI / 2
                                            const grp = worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.rechargeSparkle, position, angle, true)
                                            grp.scale.setScalar(1 / TILESIZE)
                                            surface.mesh.add(grp)
                                        } else {
                                            console.warn('Could not add sparkles to recharge seam, because of missing floor neighbor')
                                        }
                                        break
                                }
                            }
                        }
                    }
                }
            }
        })

        // create hidden caverns
        terrain.forEachSurface((surface) => {
            if (levelConf.predugMap[surface.y][surface.x] === PREDUG_MAP.cavernHidden && !surface.surfaceType.floor) {
                surface.surfaceType = SurfaceType.HIDDEN_CAVERN
            } else if (levelConf.predugMap[surface.y][surface.x] === PREDUG_MAP.slugHoleHidden) {
                surface.surfaceType = SurfaceType.HIDDEN_SLUG_HOLE
            }
        })

        terrain.updateSurfaceMeshes(true)

        if (levelConf.fallinMap) {
            for (let x = 0; x < terrain.width; x++) {
                for (let y = 0; y < terrain.height; y++) {
                    const maxTimerMs = levelConf.fallinMap[y][x] * levelConf.fallinMultiplier * 1000
                    if (maxTimerMs > 0) {
                        const targetSurface = terrain.surfaces[x][y]
                        worldMgr.ecs.addComponent(targetSurface.entity, new FallInComponent(targetSurface, maxTimerMs))
                    }
                }
            }
        }

        if (levelConf.erodeMap) {
            for (let x = 0; x < terrain.width; x++) {
                for (let y = 0; y < terrain.height; y++) {
                    const erosionLevel = levelConf.erodeMap[y][x]
                    if (erosionLevel <= 0) continue
                    const targetSurface = terrain.getSurface(x, y)
                    const lavaErosionComponent = new LavaErosionComponent(targetSurface, erosionLevel)
                    worldMgr.ecs.addComponent(targetSurface.entity, lavaErosionComponent)
                    if (lavaErosionComponent.erosionLevel % 2 === 0) { // erodes before level starts
                        for (let c = 0; c < 1 + PRNG.terrain.randInt(4); c++) {
                            lavaErosionComponent.increaseErosionLevel(false)
                        }
                    }
                }
            }
        }

        if (levelConf.emergeMap) {
            for (let x = 0; x < terrain.width; x++) {
                for (let y = 0; y < terrain.height; y++) {
                    const emergeValue = levelConf.emergeMap[y][x]
                    if (!emergeValue) continue
                    const surface = terrain.surfaces[x][y]
                    if (emergeValue % 2 === 1) {
                        worldMgr.ecs.addComponent(surface.entity, new EmergeComponent(emergeValue + 1, surface, undefined))
                    } else {
                        if (surface.surfaceType === SurfaceType.SOLID_ROCK || surface.reinforced || surface.wallType < WALL_TYPE.wall) continue // Not a valid emerge surface
                        worldMgr.ecs.addComponent(surface.entity, new EmergeComponent(emergeValue, undefined, surface))
                    }
                }
            }
        }
        return terrain
    }
}

export const PATH_MAP = {
    none: 0,
    rubble: 1,
    powerPath: 2,
} as const

export const PREDUG_MAP = {
    wall: 0,
    cavernExposed: 1,
    cavernHidden: 2,
    slugHoleExposed: 3,
    slugHoleHidden: 4,
} as const
