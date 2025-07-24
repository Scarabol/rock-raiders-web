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

function getShortest<T extends {lengthSq: number}>(objs: (T | undefined)[], precision: number, isPreferred?: (obj: T) => boolean): T | undefined {
    const shortest = objs.reduce((acc, o) => o && (!acc || o.lengthSq < acc.lengthSq) ? o : acc, undefined)
    const preferred = isPreferred && objs.find((o) => o && isPreferred(o))
    return preferred && preferred.lengthSq - shortest.lengthSq < Math.pow(TILESIZE / precision, 2) ? preferred : shortest
}

export class PathFinder {
    readonly graphByCacheKey: Map<string, ConfiguredGraph> = new Map()
    readonly cachedPathsByKey: Map<string, Vector2[] | undefined> = new Map()

    constructor(readonly surfaces: PathFindingSurfaceData[][]) {
    }

    updateSurface(surface: PathFindingSurfaceData) {
        this.graphByCacheKey.forEach((graph) => {
            const weight = PathFinder.getWeight(surface, graph.stats)
            for (let x = 0; x < graph.precision; x++) {
                for (let y = 0; y < graph.precision; y++) {
                    graph.grid[surface.x * graph.precision + x][surface.y * graph.precision + y].weight = weight
                }
            }
        })
    }

    findShortestPath(start: Vector2, targets: PathTarget[] | PathTarget | undefined, stats: MovableEntityStats, precision: number, preferredTargetLocation?: Vector2): TerrainPath | undefined {
        if (!targets) return undefined
        return getShortest(
            Array.ensure(targets).map((pathTarget) => this.findTerrainPath(start, pathTarget, stats, precision)),
            precision, preferredTargetLocation && ((p) => preferredTargetLocation.equals(p.target.targetLocation)),
        )
    }

    private findTerrainPath(start: Vector2, target: PathTarget, stats: MovableEntityStats, precision: number): TerrainPath | undefined {
        const path = this.findPath(start, target.targetLocation, stats, precision)
        if (!path) return undefined
        return new TerrainPath(target, path)
    }

    findClosestObj<T extends {
        sceneEntity: AnimatedSceneEntity
    }>(start: Vector2, objects: T[], stats: MovableEntityStats, precision: number): {
        obj: T,
        locations: Vector2[],
        lengthSq: number
    } {
        return getShortest(objects.map((obj) => {
            if (!obj) return null
            const path = this.findPath(start, obj.sceneEntity.position2D, stats, precision)
            if (!path) return null
            let lengthSq = 0
            for (let c = 0; c < path.length - 1; c++) {
                const start = path[c]
                const end = path[c + 1]
                lengthSq += start.distanceToSquared(end)
            }
            return {obj: obj, locations: path, lengthSq: lengthSq}
        }), precision)
    }

    findClosestBuilding(start: Vector2, buildings: BuildingEntity[], stats: MovableEntityStats, precision: number): {
        obj: BuildingEntity,
        locations: Vector2[],
        lengthSq: number
    } {
        return getShortest(buildings.flatMap((b) => b.getTrainingTargets().flatMap((t) => {
            const path = this.findPath(start, t.targetLocation, stats, precision)
            if (!path) return null
            let lengthSq = 0
            for (let c = 0; c < path.length - 1; c++) {
                const start = path[c]
                const end = path[c + 1]
                lengthSq += start.distanceToSquared(end)
            }
            return {obj: b, locations: path, lengthSq: lengthSq}
        })), precision)
    }

    private findPath(start: Vector2, targetLocation: Vector2, stats: MovableEntityStats, precision: number): Vector2[] | undefined {
        const gridStart = start.clone().divideScalar(TILESIZE / precision).floor()
        const gridEnd = targetLocation.clone().divideScalar(TILESIZE / precision).floor()
        const startTileX = Math.floor(gridStart.x / precision) * precision
        const startTileY = Math.floor(gridStart.y / precision) * precision
        const endTileX = Math.floor(gridEnd.x / precision) * precision
        const endTileY = Math.floor(gridEnd.y / precision) * precision
        if (startTileX === endTileX && startTileY === endTileY) return [targetLocation]
        const graphKey = `${precision} ${stats.crossLand} ${stats.crossWater} ${stats.crossLava}`
        const pathKey = `${graphKey} ${startTileX}/${startTileY} -> ${endTileX}/${endTileY}`
        const resultPath = this.cachedPathsByKey.getOrUpdate(pathKey, () => {
            const graph = this.graphByCacheKey.getOrUpdate(graphKey, () => this.createGraph(stats, precision))
            const startNode = graph.grid[gridStart.x][gridStart.y]
            const endNode = graph.grid[gridEnd.x][gridEnd.y]
            const startWeights: number[][] = []
            try {
                for (let x = startTileX; x < startTileX + precision; x++) {
                    for (let y = startTileY; y < startTileY + precision; y++) {
                        startWeights[x] = startWeights[x] ?? []
                        startWeights[x][y] = graph.grid[x][y].weight
                        graph.grid[x][y].weight = 1
                    }
                }
                startNode.weight = 1
                const freshPath = astar.search(graph, startNode, endNode)
                if (freshPath.length < 1) return undefined // no path found
                freshPath.pop() // last node is replaced with actual target position
                return freshPath.map((n) => new Vector2(n.x + 0.5, n.y + 0.5))
            } finally {
                for (let x = startTileX; x < startTileX + precision; x++) {
                    for (let y = startTileY; y < startTileY + precision; y++) {
                        graph.grid[x][y].weight = startWeights[x][y]
                    }
                }
            }
        })
        if (!resultPath) return undefined
        // return shallow copy to avoid interference
        const pathWithOffsets = resultPath.map((n) => n.clone().multiplyScalar(TILESIZE / precision))
        return [...pathWithOffsets, targetLocation]
    }

    private createGraph(stats: MovableEntityStats, precision: number) {
        const weights: number[][] = []
        for (let x = 0; x < this.surfaces.length; x++) {
            const col: number[] = []
            for (let y = 0; y < this.surfaces[0].length; y++) {
                const surface = this.surfaces[x][y]
                const w = PathFinder.getWeight(surface, stats)
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

    static getWeight(surface: PathFindingSurfaceData, stats: MovableEntityStats): number {
        if (!surface.surfaceType.floor || !surface.discovered) return 0 // TODO consider EnterWall
        else if (surface.pathBlockedByBuilding) return 0 // TODO consider EnterToolstore
        else if (surface.surfaceType.hasRubble) return 1 / (stats.rubbleCoef || 1)
        else if (surface.surfaceType === SurfaceType.WATER) return stats.crossWater ? 1 : 0
        else if (surface.surfaceType === SurfaceType.LAVA5) return stats.crossLava ? 1 : 0
        else if (surface.surfaceType === SurfaceType.POWER_PATH || surface.surfaceType === SurfaceType.POWER_PATH_BUILDING) return 1 / (stats.pathCoef || 1)
        return stats.crossLand ? 1 : 0
    }

    resetGraphsAndCaches() {
        this.graphByCacheKey.forEach((g) => g.init())
        this.cachedPathsByKey.clear()
    }
}
