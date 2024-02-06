import { Vector2 } from 'three'
import { MovableEntityStats } from '../../cfg/GameStatsCfg'
import { TILESIZE } from '../../params'
import { astar, Graph } from './astar'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'
import { Terrain } from './Terrain'
import { TerrainPath } from './TerrainPath'
import { PathTarget } from '../model/PathTarget'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { BuildingEntity } from '../model/building/BuildingEntity'

export class PathFinder {
    graphWalk: Graph = null
    graphDrive: Graph = null
    graphFly: Graph = null
    graphSwim: Graph = null
    graphLava: Graph = null
    cachedWalkPaths = new Map<string, Vector2[]>()
    cachedDrivePaths = new Map<string, Vector2[]>()
    cachedFlyPaths = new Map<string, Vector2[]>()
    cachedSwimPaths = new Map<string, Vector2[]>()
    cachedLavaPaths = new Map<string, Vector2[]>()

    initWeights(terrain: Terrain) {
        const weightsWalk: number[][] = []
        const weightsDrive: number[][] = []
        const weightsFly: number[][] = []
        const weightsSwim: number[][] = []
        const weightsLava: number[][] = []
        for (let x = 0; x < terrain.width; x++) {
            const colWalk: number[] = []
            const colDrive: number[] = []
            const colFly: number[] = []
            const colSwim: number[] = []
            const colLava: number[] = []
            for (let y = 0; y < terrain.height; y++) {
                const surface = terrain.getSurfaceOrNull(x, y)
                const w = PathFinder.getPathFindingWalkWeight(surface)
                colWalk.push(w, w, w)
                colDrive.push(PathFinder.getPathFindingDriveWeight(surface))
                colFly.push(PathFinder.getPathFindingFlyWeight(surface))
                colSwim.push(PathFinder.getPathFindingSwimWeight(surface))
                colLava.push(PathFinder.getPathFindingLavaWeight(surface))
            }
            weightsWalk.push(colWalk, colWalk, colWalk)
            weightsDrive.push(colDrive)
            weightsFly.push(colFly)
            weightsSwim.push(colSwim)
            weightsLava.push(colLava)
        }
        this.graphWalk = new Graph(weightsWalk, {diagonal: true})
        this.graphDrive = new Graph(weightsDrive, {diagonal: true})
        this.graphFly = new Graph(weightsFly, {diagonal: true})
        this.graphSwim = new Graph(weightsSwim, {diagonal: true})
        this.graphLava = new Graph(weightsLava, {diagonal: true})
    }

    updateSurface(surface: Surface) {
        const weight = PathFinder.getPathFindingWalkWeight(surface)
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                this.graphWalk.grid[surface.x * 3 + x][surface.y * 3 + y].weight = weight
            }
        }
        this.graphDrive.grid[surface.x][surface.y].weight = PathFinder.getPathFindingDriveWeight(surface)
        this.graphFly.grid[surface.x][surface.y].weight = PathFinder.getPathFindingFlyWeight(surface)
        this.graphSwim.grid[surface.x][surface.y].weight = PathFinder.getPathFindingSwimWeight(surface)
        this.graphLava.grid[surface.x][surface.y].weight = PathFinder.getPathFindingLavaWeight(surface)
    }

    static getPathFindingWalkWeight(surface: Surface): number {
        return surface.isWalkable() ? (surface.hasRubble() ? 4 : 1) : 0
    }

    static getPathFindingDriveWeight(surface: Surface): number {
        return surface.isWalkable() ? 1 : 0
    }

    static getPathFindingFlyWeight(surface: Surface): number {
        return surface.surfaceType.floor && !surface.pathBlockedByBuilding ? 1 : 0
    }

    static getPathFindingSwimWeight(surface: Surface): number {
        return surface.surfaceType === SurfaceType.WATER ? 1 : 0
    }

    static getPathFindingLavaWeight(surface: Surface): number {
        return surface.isWalkable() || surface.surfaceType === SurfaceType.LAVA5 ? 1 : 0
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

    findClosestObj<T extends { sceneEntity: AnimatedSceneEntity }>(start: Vector2, objects: T[], stats: MovableEntityStats, highPrecision: boolean): { obj: T, locations: Vector2[], lengthSq: number } {
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

    findClosestBuilding(start: Vector2, buildings: BuildingEntity[], stats: MovableEntityStats, highPrecision: boolean): { obj: BuildingEntity, locations: Vector2[], lengthSq: number } {
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
        // const canEnterToolstore = !!iGet(stats, 'EnterToolStore') // TODO consider enter toolstore in path finding
        if (highPrecision) {
            return PathFinder.getPath(start, targetLocation, this.cachedWalkPaths, this.graphWalk, TILESIZE / 3, 0.25)
        } else if (stats.CrossLand && !stats.CrossWater && !stats.CrossLava) {
            return PathFinder.getPath(start, targetLocation, this.cachedDrivePaths, this.graphDrive, TILESIZE, 0)
        } else if (!stats.CrossLand && stats.CrossWater && !stats.CrossLava) {
            return PathFinder.getPath(start, targetLocation, this.cachedSwimPaths, this.graphSwim, TILESIZE, 0)
        } else if (stats.CrossLand && stats.CrossWater && stats.CrossLava) {
            return PathFinder.getPath(start, targetLocation, this.cachedFlyPaths, this.graphFly, TILESIZE, 0)
        } else if (stats.CrossLand && !stats.CrossWater && stats.CrossLava) {
            return PathFinder.getPath(start, targetLocation, this.cachedLavaPaths, this.graphLava, TILESIZE, 0)
        } else {
            console.error(`Unexpected path finding combination (${(stats.CrossLand)}, ${(stats.CrossWater)}, ${(stats.CrossLava)}) found. No graph available returning direct path`)
            return [targetLocation]
        }
    }

    private static getPath(start: Vector2, targetLocation: Vector2, cachedPaths: Map<string, Vector2[]>, graph: Graph, gridSize: number, maxRandomOffset: number): Vector2[] {
        const gridStart = start.clone().divideScalar(gridSize).floor()
        const gridEnd = targetLocation.clone().divideScalar(gridSize).floor()
        if (gridStart.x === gridEnd.x && gridStart.y === gridEnd.y) return [targetLocation]
        const cacheIdentifier = `${gridStart.x}/${gridStart.y} -> ${gridEnd.x}/${gridEnd.y}`
        const resultPath = cachedPaths.getOrUpdate(cacheIdentifier, () => {
            const startNode = graph.grid[gridStart.x][gridStart.y]
            const endNode = graph.grid[gridEnd.x][gridEnd.y]
            const freshPath = astar.search(graph, startNode, endNode).map((n) =>
                new Vector2(n.x + 0.5, n.y + 0.5).add(new Vector2().random().multiplyScalar(maxRandomOffset)).multiplyScalar(gridSize))
            if (freshPath.length < 1) return null // no path found
            freshPath.pop() // last node is replaced with actual target position
            return freshPath
        })
        if (!resultPath) return null
        return [...resultPath, targetLocation] // return shallow copy to avoid interference
    }

    resetGraphsAndCaches() {
        this.graphWalk.init()
        this.graphDrive.init()
        this.graphFly.init()
        this.graphSwim.init()
        this.graphLava.init()
        this.cachedWalkPaths.clear()
        this.cachedDrivePaths.clear()
        this.cachedFlyPaths.clear()
        this.cachedSwimPaths.clear()
        this.cachedLavaPaths.clear()
    }
}
