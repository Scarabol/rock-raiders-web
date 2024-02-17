import { LevelConfData } from './LevelLoader'
import { HEIGHT_MULTIPLIER, TILESIZE } from '../params'
import { Surface } from './terrain/Surface'
import { SurfaceType } from './terrain/SurfaceType'
import { Terrain } from './terrain/Terrain'
import { WorldManager } from './WorldManager'
import { Vector3 } from 'three'
import { LavaErosionComponent } from './component/LavaErosionComponent'
import { GameConfig } from '../cfg/GameConfig'
import { EmergeComponent } from './component/EmergeComponent'
import { FallInComponent } from './component/FallInComponent'

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
                if (predugLevel === PredugMap.CAVERN_EXPOSED) {
                    if (surfaceType === SurfaceType.GROUND || surfaceType === SurfaceType.DIRT
                        || surfaceType === SurfaceType.SOLID_ROCK || surfaceType === SurfaceType.HARD_ROCK // as seen in level 14
                        || surfaceType === SurfaceType.POWER_PATH_BUILDING) { // used by mods
                        surfaceType = SurfaceType.GROUND
                    } else if (surfaceType !== SurfaceType.WATER && surfaceType !== SurfaceType.LAVA5) {
                        console.warn(`Unexpected cavern surface type: ${surfaceType.name}`)
                    }
                } else if (predugLevel === PredugMap.SLUG_HOLE_EXPOSED || predugLevel === PredugMap.SLUG_HOLE_HIDDEN) {
                    surfaceType = SurfaceType.SLUG_HOLE
                } else if (predugLevel !== PredugMap.WALL && predugLevel !== PredugMap.CAVERN_HIDDEN) {
                    console.warn(`Unexpected predug level: ${predugLevel}`)
                }
                // give the path map the highest priority, if it exists
                const pathMapLevel = levelConf.pathMap && surfaceType.floor ? levelConf.pathMap[r][c] : PathMap.NONE
                if (pathMapLevel === PathMap.RUBBLE) {
                    surfaceType = SurfaceType.RUBBLE4
                } else if (pathMapLevel === PathMap.POWER_PATH) {
                    surfaceType = SurfaceType.POWER_PATH
                } else if (pathMapLevel !== PathMap.NONE) {
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
                const offsets = [levelConf.surfaceMap?.[y - 1]?.[x - 1], levelConf.surfaceMap?.[y - 1]?.[x], levelConf.surfaceMap?.[y]?.[x - 1], levelConf.surfaceMap?.[y]?.[x]].filter((n) => !isNaN(n))
                terrain.heightOffset[x][y] = offsets.reduce((l, r) => l + r, 0) / (offsets.length || 1) * HEIGHT_MULTIPLIER
            }
        }

        // explore pre-dug surfaces
        terrain.forEachSurface((s) => {
            if (levelConf.predugMap[s.y][s.x] === PredugMap.CAVERN_EXPOSED || levelConf.predugMap[s.y][s.x] === PredugMap.SLUG_HOLE_EXPOSED) { // map are rows (y) first, columns (x) second
                for (let x = s.x - 1; x <= s.x + 1; x++) {
                    for (let y = s.y - 1; y <= s.y + 1; y++) {
                        const surface = terrain.getSurfaceOrNull(x, y)
                        if (surface) {
                            surface.discovered = true
                            if (surface.neighbors.some((n) => n.surfaceType.floor)) {
                                switch (surface.surfaceType) {
                                    case SurfaceType.SLUG_HOLE:
                                        terrain.slugHoles.add(surface)
                                        break
                                    case SurfaceType.RECHARGE_SEAM:
                                        terrain.rechargeSeams.add(surface)
                                        // TODO Move sparkles effect to surface mesh (creation)
                                        const position = new Vector3(0.5, 0.5 + surface.terrain.getHeightOffset(surface.x, surface.y), 0.5)
                                        const floorNeighbor = surface.neighbors.find((n) => n.surfaceType.floor)
                                        const angle = Math.atan2(floorNeighbor.y - surface.y, surface.x - floorNeighbor.x) + Math.PI / 2
                                        const grp = worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.RechargeSparkle, position, angle, true)
                                        grp.scale.setScalar(1 / TILESIZE)
                                        surface.mesh.add(grp)
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
            if (levelConf.predugMap[surface.y][surface.x] === PredugMap.CAVERN_HIDDEN && !surface.surfaceType.floor) {
                surface.surfaceType = SurfaceType.HIDDEN_CAVERN
            } else if (levelConf.predugMap[surface.y][surface.x] === PredugMap.SLUG_HOLE_HIDDEN) {
                surface.surfaceType = SurfaceType.HIDDEN_SLUG_HOLE
            }
        })

        terrain.updateSurfaceMeshes(true)

        if (levelConf.fallinMap) {
            for (let x = 0; x < terrain.width; x++) {
                for (let y = 0; y < terrain.height; y++) {
                    const maxTimerMs = levelConf.fallinMap[y][x] * levelConf.fallinMultiplier * 1000
                    if (maxTimerMs > 0) {
                        const surface = terrain.surfaces[x][y]
                        worldMgr.ecs.addComponent(surface.entity, new FallInComponent(surface, maxTimerMs))
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
                    if (lavaErosionComponent.isSelfEroding) {
                        for (let c = 0; c < 5; c++) {
                            lavaErosionComponent.increaseErosionLevel(false)
                        }
                    }
                }
            }
        }

        if (levelConf.blockPointersMap) {
            for (let x = 0; x < terrain.width; x++) {
                for (let y = 0; y < terrain.height; y++) {
                    const tutoBlockId = levelConf.blockPointersMap[y][x]
                    if (tutoBlockId) {
                        terrain.tutoBlocksById.getOrUpdate(tutoBlockId, () => []).push(terrain.surfaces[x][y])
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
                        worldMgr.ecs.addComponent(surface.entity, new EmergeComponent(emergeValue + 1, surface, null))
                    } else {
                        worldMgr.ecs.addComponent(surface.entity, new EmergeComponent(emergeValue, null, surface))
                    }
                }
            }
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
