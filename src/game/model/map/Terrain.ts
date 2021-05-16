import { AxesHelper, Group, Vector2, Vector3 } from 'three'
import { DEV_MODE, TILESIZE } from '../../../params'
import { SceneManager } from '../../SceneManager'
import { WorldManager } from '../../WorldManager'
import { PathTarget } from '../PathTarget'
import { astar, Graph } from './astar'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'
import { TerrainPath } from './TerrainPath'

export class Terrain {

    worldMgr: WorldManager
    sceneMgr: SceneManager
    textureSet: any = {}
    width: number = 0
    height: number = 0
    surfaces: Surface[][] = []
    floorGroup: Group = new Group()
    roofGroup: Group = new Group()
    graphWalk: Graph = null
    cachedWalkPaths = new Map<string, Vector2[]>()

    constructor(worldMgr: WorldManager, sceneMgr: SceneManager) {
        this.worldMgr = worldMgr
        this.sceneMgr = sceneMgr
        this.floorGroup.scale.setScalar(TILESIZE)
        this.roofGroup.scale.setScalar(TILESIZE)
        this.roofGroup.visible = false // keep roof hidden unless switched to other camera
        if (DEV_MODE) this.floorGroup.add(new AxesHelper())
    }

    getSurfaceFromWorld(worldPosition: Vector3): Surface | null {
        return this.getSurfaceFromWorldXZ(worldPosition.x, worldPosition.z)
    }

    getSurfaceFromWorld2D(worldPosition: Vector2): Surface | null {
        return this.getSurfaceFromWorldXZ(worldPosition.x, worldPosition.y)
    }

    getSurfaceFromWorldXZ(worldX: number, worldZ: number): Surface | null {
        return this.getSurface(worldX / TILESIZE, worldZ / TILESIZE)
    }

    getSurface(x, y): Surface {
        x = Math.floor(x)
        y = Math.floor(y)
        return this.getSurfaceOrNull(x, y) || new Surface(this, SurfaceType.SOLID_ROCK, x, y, 0)
    }

    getSurfaceOrNull(x, y): Surface | null {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.surfaces[x][y]
        } else {
            return null
        }
    }

    updateSurfaceMeshes(force: boolean = false) {
        this.forEachSurface((s) => s.updateMesh(force))
        this.floorGroup.updateWorldMatrix(true, true) // otherwise ray intersection is not working before rendering
        this.resetGraphWalk()
    }

    resetGraphWalk() {
        this.graphWalk.init()
        this.cachedWalkPaths.clear()
        console.log('Cached paths cleared')
    }

    findWalkPath(start: Vector2, target: PathTarget): TerrainPath {
        const gridStart = start.clone().multiplyScalar(3 / TILESIZE).floor()
        const gridEnd = target.targetLocation.clone().multiplyScalar(3 / TILESIZE).floor()
        if (gridStart.x === gridEnd.x && gridStart.y === gridEnd.y) return new TerrainPath(target, target.targetLocation)
        const cacheIdentifier = gridStart.x + '/' + gridStart.y + ' -> ' + gridEnd.x + '/' + gridEnd.y
        const walkPath = this.cachedWalkPaths.getOrUpdate(cacheIdentifier, () => {
            const startNode = this.graphWalk.grid[gridStart.x][gridStart.y]
            const endNode = this.graphWalk.grid[gridEnd.x][gridEnd.y]
            const path = astar.search(this.graphWalk, startNode, endNode).map((n) => Terrain.gridNodeToWorldPos(n))
            if (path.length < 1) return null // no path found
            path.pop() // last node is replaced with actual target position
            return path
        })
        if (!walkPath) return null
        return new TerrainPath(target, [...walkPath, target.targetLocation]) // return shallow copy to avoid interference
    }

    private static gridNodeToWorldPos(gridNode) {
        return new Vector2(Math.random(), Math.random()).divideScalar(2).add(gridNode).multiplyScalar(TILESIZE / 3)
    }

    findFallInOrigin(x: number, y: number): [number, number] {
        const leftSurface = this.getSurface(x - 1, y)
        if (leftSurface.isReinforcable()) return [leftSurface.x, leftSurface.y]
        const topSurface = this.getSurface(x, y - 1)
        if (topSurface.isReinforcable()) return [topSurface.x, topSurface.y]
        const rightSurface = this.getSurface(x + 1, y)
        if (rightSurface.isReinforcable()) return [rightSurface.x, rightSurface.y]
        const bottomSurface = this.getSurface(x, y + 1)
        if (bottomSurface.isReinforcable()) return [bottomSurface.x, bottomSurface.y]
        const leftSurface2 = this.getSurface(x - 1, y)
        if (leftSurface2.isDigable()) return [leftSurface2.x, leftSurface2.y]
        const topSurface2 = this.getSurface(x, y - 1)
        if (topSurface2.isDigable()) return [topSurface2.x, topSurface2.y]
        const rightSurface2 = this.getSurface(x + 1, y)
        if (rightSurface2.isDigable()) return [rightSurface2.x, rightSurface2.y]
        const bottomSurface2 = this.getSurface(x, y + 1)
        if (bottomSurface2.isDigable()) return [bottomSurface2.x, bottomSurface2.y]
        return null
    }

    findFallInTarget(x: number, y: number): [number, number] {
        const leftSurface = this.getSurface(x - 1, y)
        if (leftSurface.isWalkable()) return [leftSurface.x, leftSurface.y]
        const topSurface = this.getSurface(x, y - 1)
        if (topSurface.isWalkable()) return [topSurface.x, topSurface.y]
        const rightSurface = this.getSurface(x + 1, y)
        if (rightSurface.isWalkable()) return [rightSurface.x, rightSurface.y]
        const bottomSurface = this.getSurface(x, y + 1)
        if (bottomSurface.isWalkable()) return [bottomSurface.x, bottomSurface.y]
        return null
    }

    dispose() {
        this.forEachSurface(s => s.dispose())
    }

    forEachSurface(each: (surface: Surface) => any) {
        this.surfaces?.forEach((r) => r.forEach((s) => each(s)))
    }

    countDiggables(): number {
        let totalDiggables = 0
        this.forEachSurface((s) => totalDiggables += s.isDigable() ? 1 : 0)
        return totalDiggables
    }

    countCrystals(): number {
        let totalCrystals = 0
        this.forEachSurface((s) => totalCrystals += s.containedCrystals)
        return totalCrystals
    }

    countOres(): number {
        let totalOres = 0
        this.forEachSurface((s) => totalOres += s.containedOres)
        return totalOres
    }

}
