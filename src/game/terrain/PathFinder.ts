import { Vector2 } from 'three'
import { MovableEntityStats } from '../../cfg/GameStatsCfg'
import { TILESIZE } from '../../params'
import { astar, Graph } from './astar'
import { SurfaceType } from './SurfaceType'
import { TerrainPath } from './TerrainPath'
import { PathTarget } from '../model/PathTarget'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { BuildingEntity } from '../model/building/BuildingEntity'

class ConfiguredGraph extends Graph {
    constructor(
        grid: number[][],
        readonly precision: number,
        readonly stats: MovableEntityStats
    ) {
        super(grid, {diagonal: true})
    }
}

interface PathFindingSurfaceData {
    x: number
    y: number
    surfaceType: SurfaceType
    discovered: boolean
    pathBlockedByBuilding: boolean
}

export class PathFinder {
    readonly graphByCacheKey: Map<string, ConfiguredGraph> = new Map()
    readonly cachedPathsByKey: Map<string, Vector2[]> = new Map()

    constructor(readonly surfaces: PathFindingSurfaceData[][]) {
    }

    updateSurface(surface: PathFindingSurfaceData) {
        this.graphByCacheKey.forEach((graph) => {
            const weight = this.getWeight(surface, graph.stats)
            for (let x = 0; x < graph.precision; x++) {
                for (let y = 0; y < graph.precision; y++) {
                    graph.grid[surface.x * graph.precision + x][surface.y * graph.precision + y].weight = weight
                }
            }
        })
    }

    findShortestPath(start: Vector2, targets: PathTarget[] | PathTarget, stats: MovableEntityStats, highPrecision: boolean): TerrainPath {
        return Array.ensure(targets).map((pathTarget) => this.findTerrainPath(start, pathTarget, stats, highPrecision))
            .filter((terrainPath) => !!terrainPath)
            .sort((l, r) => l.lengthSq - r.lengthSq)[0]
    }

    private findTerrainPath(start: Vector2, target: PathTarget, stats: MovableEntityStats, highPrecision: boolean): TerrainPath {
        if (!target) return null
        const path = this.findPath(start, target.targetLocation, stats, highPrecision)
        if (!path) return null
        return new TerrainPath(target, path)
    }

    findClosestObj<T extends {
        sceneEntity: AnimatedSceneEntity
    }>(start: Vector2, objects: T[], stats: MovableEntityStats, highPrecision: boolean): {
        obj: T,
        locations: Vector2[],
        lengthSq: number
    } {
        return objects.map((obj) => {
            if (!obj) return null
            const path = this.findPath(start, obj.sceneEntity.position2D, stats, highPrecision)
            if (!path) return null
            let lengthSq = 0
            for (let c = 0; c < path.length - 1; c++) {
                const start = path[c]
                const end = path[c + 1]
                lengthSq += start.distanceToSquared(end)
            }
            return {obj: obj, locations: path, lengthSq: lengthSq}
        }).filter((terrainPath) => !!terrainPath)
            .sort((l, r) => l.lengthSq - r.lengthSq)[0]
    }

    findClosestBuilding(start: Vector2, buildings: BuildingEntity[], stats: MovableEntityStats, highPrecision: boolean): {
        obj: BuildingEntity,
        locations: Vector2[],
        lengthSq: number
    } {
        return buildings.flatMap((b) => b.getTrainingTargets().flatMap((t) => {
            const path = this.findPath(start, t.targetLocation, stats, highPrecision)
            if (!path) return null
            let lengthSq = 0
            for (let c = 0; c < path.length - 1; c++) {
                const start = path[c]
                const end = path[c + 1]
                lengthSq += start.distanceToSquared(end)
            }
            return {obj: b, locations: path, lengthSq: lengthSq}
        })).filter((terrainPath) => !!terrainPath)
            .sort((l, r) => l.lengthSq - r.lengthSq)[0]
    }

    private findPath(start: Vector2, targetLocation: Vector2, stats: MovableEntityStats, highPrecision: boolean): Vector2[] {
        const precision = highPrecision ? 3 : 1
        const maxRandomOffset = highPrecision ? 0.25 : 0
        const gridStart = start.clone().divideScalar(TILESIZE / precision).floor()
        const gridEnd = targetLocation.clone().divideScalar(TILESIZE / precision).floor()
        if (gridStart.x === gridEnd.x && gridStart.y === gridEnd.y) return [targetLocation]
        const graphKey = `${highPrecision} ${stats.CrossLand} ${stats.CrossWater} ${stats.CrossLava}`
        const pathKey = `${graphKey} ${gridStart.x}/${gridStart.y} -> ${gridEnd.x}/${gridEnd.y}`
        const resultPath = this.cachedPathsByKey.getOrUpdate(pathKey, () => {
            const graph = this.graphByCacheKey.getOrUpdate(graphKey, () => {
                return this.createGraph(stats, precision)
            })
            const startNode = graph.grid[gridStart.x][gridStart.y]
            const endNode = graph.grid[gridEnd.x][gridEnd.y]
            const freshPath = astar.search(graph, startNode, endNode).map((n) =>
                new Vector2(n.x + 0.5, n.y + 0.5).add(new Vector2().random().multiplyScalar(maxRandomOffset)).multiplyScalar(TILESIZE / precision))
            if (freshPath.length < 1) return null // no path found
            freshPath.pop() // last node is replaced with actual target position
            return freshPath
        })
        if (!resultPath) return null
        return [...resultPath, targetLocation] // return shallow copy to avoid interference
    }

    private createGraph(stats: MovableEntityStats, precision: number) {
        const weights: number[][] = []
        for (let x = 0; x < this.surfaces.length; x++) {
            const col: number[] = []
            for (let y = 0; y < this.surfaces[0].length; y++) {
                const surface = this.surfaces[x][y]
                const w = this.getWeight(surface, stats)
                for (let c = 0; c < precision; c++) {
                    col.push(w)
                }
            }
            for (let c = 0; c < precision; c++) {
                weights.push(col)
            }
        }
        return new ConfiguredGraph(weights, precision, stats)
    }

    private getWeight(surface: PathFindingSurfaceData, stats: MovableEntityStats): number {
        if (!surface.surfaceType.floor || !surface.discovered) return 0 // TODO consider EnterWall
        else if (surface.pathBlockedByBuilding) return 0 // TODO consider EnterToolstore
        else if (surface.surfaceType.hasRubble) return 1 / (stats.RubbleCoef || 1)
        else if (surface.surfaceType === SurfaceType.WATER) return stats.CrossWater ? 1 : 0
        else if (surface.surfaceType === SurfaceType.LAVA5) return stats.CrossLava ? 1 : 0
        else if (surface.surfaceType === SurfaceType.POWER_PATH || surface.surfaceType === SurfaceType.POWER_PATH_BUILDING) return 1 / (stats.PathCoef || 1)
        return stats.CrossLand ? 1 : 0
    }

    resetGraphsAndCaches() {
        this.graphByCacheKey.forEach((g) => g.init())
        this.cachedPathsByKey.clear()
    }
}
