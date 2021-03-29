import { Group, Vector3 } from 'three'
import { Surface } from './Surface'
import { WorldManager } from '../../WorldManager'
import { SurfaceType } from './SurfaceType'
import { TILESIZE } from '../../../main'
import { EventBus } from '../../../event/EventBus'
import { EntityAddedEvent, EntityType } from '../../../event/WorldEvents'
import { BuildingEntity } from '../BuildingEntity'
import { astar, Graph } from './astar'

export class Terrain {

    worldMgr: WorldManager
    textureSet: any = {}
    width: number = 0
    height: number = 0
    surfaces: Surface[][] = []
    floorGroup: Group = new Group()
    roofGroup: Group = new Group()
    graphWalk: Graph = null
    cachedPaths = new Map()

    constructor(worldMgr: WorldManager) {
        this.worldMgr = worldMgr
        this.floorGroup.scale.set(TILESIZE, TILESIZE, TILESIZE)
        this.roofGroup.visible = false // keep roof hidden unless switched to other camera
        EventBus.registerEventListener(EntityAddedEvent.eventKey, (event: EntityAddedEvent) => {
            if (event.type !== EntityType.BUILDING) return;
            (event.entity as BuildingEntity).surfaces.forEach((bSurf) => {
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        this.getSurface(bSurf.x + x, bSurf.y + y).updateTexture()
                    }
                }
            })
        })
    }

    getSurfaceFromWorld(worldPosition: Vector3): Surface | null {
        return this.getSurface(worldPosition.x / TILESIZE, worldPosition.z / TILESIZE)
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
        this.surfaces.forEach((r) => r.forEach((s) => s.updateMesh(force)))
        this.floorGroup.updateWorldMatrix(true, true) // otherwise ray intersection is not working before rendering

        // TODO performance: update specific graph entry, when surface type changes
        this.graphWalk = new Graph(this.surfaces.map(c => c.map(s => s.isWalkable() ? s.hasRubble() ? 4 : 1 : 0)))
        console.log('Cached paths cleared')
        this.cachedPaths.clear()
    }

    findPath(start: Vector3, end: Vector3, canFly = false, canSwim = false): Vector3[] {
        const startSurface = this.getSurfaceFromWorld(start)
        const endSurface = this.getSurfaceFromWorld(end)
        if (startSurface.x === endSurface.x && startSurface.y === endSurface.y) {
            return [end]
        }
        const cacheIdentifier = startSurface.x + '/' + startSurface.y + ' -> ' + endSurface.x + '/' + endSurface.y
        const cachedPath = this.cachedPaths.get(cacheIdentifier)
        if (cachedPath) {
            return [...cachedPath, end]
        } else {
            return this.searchPath(startSurface, endSurface, end, cacheIdentifier)
        }
    }

    private searchPath(startSurface: Surface, endSurface: Surface, end, cacheIdentifier: string) {
        const startNode = this.graphWalk.grid[startSurface.x][startSurface.y]
        const endNode = this.graphWalk.grid[endSurface.x][endSurface.y]
        const worldPath = astar.search(this.graphWalk, startNode, endNode).map(p => this.getSurface(p.x, p.y).getCenterWorld())
        if (worldPath.length < 1) return null // no path found
        // replace last surface center with actual target position
        worldPath.pop()
        worldPath.push(end)
        this.cachedPaths.set(cacheIdentifier, worldPath.slice(0, -1)) // cache shallow copy to avoid interference
        return worldPath
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

}
