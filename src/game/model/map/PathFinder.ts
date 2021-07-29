import { Vector2 } from 'three'
import { iGet } from '../../../core/Util'
import { TILESIZE } from '../../../params'
import { PathTarget } from '../PathTarget'
import { astar, Graph } from './astar'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'
import { Terrain } from './Terrain'
import { TerrainPath } from './TerrainPath'

export class PathFinder {
    graphWalk: Graph = null
    graphDrive: Graph = null
    graphFly: Graph = null
    graphSwim: Graph = null
    cachedWalkPaths = new Map<string, Vector2[]>()
    cachedDrivePaths = new Map<string, Vector2[]>()
    cachedFlyPaths = new Map<string, Vector2[]>()
    cachedSwimPaths = new Map<string, Vector2[]>()

    initWeights(terrain: Terrain) {
        const weightsWalk: number[][] = []
        const weightsDrive: number[][] = []
        const weightsFly: number[][] = []
        const weightsSwim: number[][] = []
        for (let x = 0; x < terrain.width; x++) {
            const colWalk: number[] = []
            const colDrive: number[] = []
            const colFly: number[] = []
            const colSwim: number[] = []
            for (let y = 0; y < terrain.height; y++) {
                const surface = terrain.getSurfaceOrNull(x, y)
                const w = PathFinder.getPathfindingWalkWeight(surface)
                colWalk.push(w, w, w)
                colDrive.push(PathFinder.getPathfindingDriveWeight(surface))
                colFly.push(PathFinder.getPathFindingFlyWeight(surface))
                colSwim.push(PathFinder.getPathFindingSwimWeight(surface))
            }
            weightsWalk.push(colWalk, colWalk, colWalk)
            weightsDrive.push(colDrive)
            weightsFly.push(colFly)
            weightsSwim.push(colSwim)
        }
        this.graphWalk = new Graph(weightsWalk, {diagonal: true})
        this.graphDrive = new Graph(weightsDrive, {diagonal: true})
        this.graphFly = new Graph(weightsFly, {diagonal: true})
        this.graphSwim = new Graph(weightsSwim, {diagonal: true})
    }

    updateSurface(surface: Surface) {
        const weight = PathFinder.getPathfindingWalkWeight(surface)
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                this.graphWalk.grid[surface.x * 3 + x][surface.y * 3 + y].weight = weight
            }
        }
        this.graphDrive.grid[surface.x][surface.y].weight = PathFinder.getPathfindingDriveWeight(surface)
        this.graphFly.grid[surface.x][surface.y].weight = PathFinder.getPathFindingFlyWeight(surface)
        this.graphSwim.grid[surface.x][surface.y].weight = PathFinder.getPathFindingSwimWeight(surface)
    }

    static getPathfindingWalkWeight(surface: Surface): number {
        return surface.isWalkable() ? surface.hasRubble() ? 4 : 1 : 0
    }

    static getPathfindingDriveWeight(surface: Surface): number {
        return surface.isWalkable() ? 1 : 0
    }

    static getPathFindingFlyWeight(surface: Surface): number {
        return surface.surfaceType.floor && !surface.pathBlockedByBuilding ? 1 : 0
    }

    static getPathFindingSwimWeight(surface: Surface): number {
        return surface.surfaceType === SurfaceType.WATER ? 1 : 0
    }

    findPath(start: Vector2, target: PathTarget, stats: {}, highPrecision: boolean): TerrainPath {
        const crossLand = !!iGet(stats, 'CrossLand')
        const crossWater = !!iGet(stats, 'CrossWater')
        const crossLava = !!iGet(stats, 'CrossLava')
        // const canEnterToolstore = !!iGet(stats, 'EnterToolStore') // TODO consider enter toolstore in path finding
        if (highPrecision) {
            return this.findWalkPath(start, target)
        } else if (crossLand && !crossWater && !crossLava) {
            return this.findDrivePath(start, target)
        } else if (!crossLand && crossWater && !crossLava) {
            return this.findSwimPath(start, target)
        } else if (crossLand && crossWater && crossLava) {
            return this.findFlyPath(start, target)
        } else { // TODO at least path finding for LavaMonster missing
            console.error(`Unexpected path finding combination (${crossLand}, ${crossWater}, ${crossLava}) found. No graph available returning direct path`)
            return new TerrainPath(target, target.targetLocation)
        }
    }

    private findWalkPath(start: Vector2, target: PathTarget): TerrainPath {
        return PathFinder.getPath(start, target, this.cachedWalkPaths, this.graphWalk, TILESIZE / 3, 0.25)
    }

    private findDrivePath(start: Vector2, target: PathTarget): TerrainPath {
        return PathFinder.getPath(start, target, this.cachedDrivePaths, this.graphDrive, TILESIZE, 0)
    }

    private findFlyPath(start: Vector2, target: PathTarget): TerrainPath {
        return PathFinder.getPath(start, target, this.cachedFlyPaths, this.graphFly, TILESIZE, 0)
    }

    private findSwimPath(start: Vector2, target: PathTarget): TerrainPath {
        return PathFinder.getPath(start, target, this.cachedSwimPaths, this.graphSwim, TILESIZE, 0)
    }

    private static getPath(start: Vector2, target: PathTarget, cachedPaths: Map<string, Vector2[]>, graph: Graph, gridSize: number, maxRandomOffset: number): TerrainPath {
        const gridStart = start.clone().divideScalar(gridSize).floor()
        const gridEnd = target.targetLocation.clone().divideScalar(gridSize).floor()
        if (gridStart.x === gridEnd.x && gridStart.y === gridEnd.y) return new TerrainPath(target, target.targetLocation)
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
        return new TerrainPath(target, [...resultPath, target.targetLocation]) // return shallow copy to avoid interference
    }

    resetGraphsAndCaches() {
        this.graphWalk.init()
        this.graphDrive.init()
        this.graphFly.init()
        this.graphSwim.init()
        this.cachedWalkPaths.clear()
        this.cachedDrivePaths.clear()
        this.cachedFlyPaths.clear()
        this.cachedSwimPaths.clear()
        console.log('Cached paths cleared')
    }
}
