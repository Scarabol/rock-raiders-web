import { AxesHelper, Group, Vector2, Vector3 } from 'three'
import { EventBus } from '../../../event/EventBus'
import { LandslideEvent } from '../../../event/WorldLocationEvent'
import { DEV_MODE, TILESIZE } from '../../../params'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { AnimationGroup } from '../anim/AnimationGroup'
import { PathTarget } from '../PathTarget'
import { updateSafe } from '../Updateable'
import { astar, Graph } from './astar'
import { FallIn } from './FallIn'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'
import { TerrainPath } from './TerrainPath'

export class Terrain {

    sceneMgr: SceneManager
    entityMgr: EntityManager
    textureSet: any = {}
    width: number = 0
    height: number = 0
    surfaces: Surface[][] = []
    floorGroup: Group = new Group()
    roofGroup: Group = new Group()
    graphWalk: Graph = null
    graphDrive: Graph = null
    graphFly: Graph = null
    graphSwim: Graph = null
    cachedWalkPaths = new Map<string, Vector2[]>()
    cachedDrivePaths = new Map<string, Vector2[]>()
    cachedFlyPaths = new Map<string, Vector2[]>()
    cachedSwimPaths = new Map<string, Vector2[]>()
    fallIns: FallIn[] = []
    fallInGroups: AnimationGroup[] = []

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        this.sceneMgr = sceneMgr
        this.entityMgr = entityMgr
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
        this.graphDrive.init()
        this.graphFly.init()
        this.graphSwim.init()
        this.cachedWalkPaths.clear()
        this.cachedDrivePaths.clear()
        this.cachedFlyPaths.clear()
        this.cachedSwimPaths.clear()
        console.log('Cached paths cleared')
    }

    findWalkPath(start: Vector2, target: PathTarget): TerrainPath {
        return Terrain.findPath(start, target, this.cachedWalkPaths, this.graphWalk, 3 / TILESIZE, 0.25)
    }

    findDrivePath(start: Vector2, target: PathTarget): TerrainPath {
        return Terrain.findPath(start, target, this.cachedDrivePaths, this.graphDrive, 1 / TILESIZE, 0)
    }

    findFlyPath(start: Vector2, target: PathTarget): TerrainPath {
        return Terrain.findPath(start, target, this.cachedFlyPaths, this.graphFly, 1 / TILESIZE, 0)
    }

    findSwimPath(start: Vector2, target: PathTarget): TerrainPath {
        return Terrain.findPath(start, target, this.cachedSwimPaths, this.graphSwim, 1 / TILESIZE, 0)
    }

    private static findPath(start: Vector2, target: PathTarget, cachedPaths: Map<string, Vector2[]>, graph: Graph, gridScale: number, maxRandomOffset: number): TerrainPath {
        const gridStart = start.clone().multiplyScalar(gridScale).floor()
        const gridEnd = target.targetLocation.clone().multiplyScalar(gridScale).floor()
        if (gridStart.x === gridEnd.x && gridStart.y === gridEnd.y) return new TerrainPath(target, target.targetLocation)
        const cacheIdentifier = gridStart.x + '/' + gridStart.y + ' -> ' + gridEnd.x + '/' + gridEnd.y
        const resultPath = cachedPaths.getOrUpdate(cacheIdentifier, () => {
            const startNode = graph.grid[gridStart.x][gridStart.y]
            const endNode = graph.grid[gridEnd.x][gridEnd.y]
            const freshPath = astar.search(graph, startNode, endNode).map((n) =>
                new Vector2(n.x + 0.5, n.y + 0.5).add(new Vector2().random().multiplyScalar(maxRandomOffset)).divideScalar(gridScale))
            if (freshPath.length < 1) return null // no path found
            freshPath.pop() // last node is replaced with actual target position
            return freshPath
        })
        if (!resultPath) return null
        return new TerrainPath(target, [...resultPath, target.targetLocation]) // return shallow copy to avoid interference
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

    setFallinLevel(x: number, y: number, fallinLevel: number) {
        if (fallinLevel < 1) return
        const surface = this.getSurface(x, y)
        let originPos: Surface = null
        let targetPos: Surface = null
        if (surface.surfaceType.floor) {
            originPos = this.findFallInOrigin(surface)
            targetPos = surface
        } else if (surface.isReinforcable()) {
            originPos = surface
            targetPos = this.findFallInTarget(surface)
        }
        if (originPos && targetPos) {
            this.fallIns.push(new FallIn(this, originPos, targetPos))
        }
    }

    findFallInOrigin(target: Surface): Surface {
        const s = target.neighbors.find((n) => n.isReinforcable())
        if (!s) return null
        return s
    }

    findFallInTarget(source: Surface): Surface {
        const s = source.neighbors.find((n) => n.isWalkable()) // TODO don't target surfaces with lava erosion
        if (!s) return null
        return s
    }

    createFallIn(source: Surface, target: Surface) {
        const fallinPosition = target.getCenterWorld()
        EventBus.publishEvent(new LandslideEvent(fallinPosition))
        const fallinGrp = new AnimationGroup('MiscAnims/RockFall/Rock3Sides.lws', this.sceneMgr.listener)
        this.fallInGroups.push(fallinGrp)
        fallinGrp.position.copy(fallinPosition)
        const dx = source.x - target.x, dy = target.y - source.y
        fallinGrp.rotateOnAxis(new Vector3(0, 1, 0), Math.atan2(dy, dx) + Math.PI / 2)
        this.sceneMgr.scene.add(fallinGrp)
        fallinGrp.startAnimation(() => {
            this.sceneMgr.scene.remove(fallinGrp)
            this.fallInGroups.remove(fallinGrp)
        })
        target.makeRubble() // TODO do not turn building power paths into rubble
    }

    removeFallInOrigin(surface: Surface) {
        this.fallIns = this.fallIns.filter((f) => f.source !== surface)
    }

    update(elapsedMs: number) {
        this.fallIns.forEach((f) => updateSafe(f, elapsedMs))
        this.fallInGroups.forEach((g) => updateSafe(g, elapsedMs))
    }

}
