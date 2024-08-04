import { Vector2, Vector3 } from 'three'
import { LevelConfData } from '../LevelLoader'
import { SURFACE_NUM_CONTAINED_ORE, TILESIZE } from '../../params'
import { WorldManager } from '../WorldManager'
import { PathFinder } from './PathFinder'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'
import { LandslideEvent } from '../../event/WorldLocationEvent'
import { PositionComponent } from '../component/PositionComponent'
import { WALL_TYPE } from './WallType'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'

export class Terrain {
    heightOffset: number[][] = [[]]
    width: number = 0
    height: number = 0
    surfaces: Surface[][] = []
    pathFinder: PathFinder = new PathFinder(this.surfaces)
    slugHoles: Surface[] = []
    rechargeSeams: Surface[] = []

    constructor(readonly worldMgr: WorldManager, readonly levelConf: LevelConfData) {
        this.width = levelConf.mapWidth
        this.height = levelConf.mapHeight
    }

    getSurfaceFromWorld(worldPosition: Vector3): Surface {
        return this.getSurfaceFromWorldXZ(worldPosition.x, worldPosition.z)
    }

    getSurfaceFromWorld2D(worldPosition: Vector2): Surface {
        return this.getSurfaceFromWorldXZ(worldPosition.x, worldPosition.y)
    }

    getSurfaceFromWorldXZ(worldX: number, worldZ: number): Surface {
        return this.getSurface(worldX / TILESIZE, worldZ / TILESIZE)
    }

    getSurface(x: number, y: number): Surface {
        x = Math.floor(x)
        y = Math.floor(y)
        return this.getSurfaceOrNull(x, y) || new Surface(this, SurfaceType.SOLID_ROCK, x, y)
    }

    getSurfaceOrNull(x: number, y: number): Surface | null {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.surfaces[x][y]
        } else {
            return null
        }
    }

    getAdjacent(x: number, y: number): {
        left: Surface, topLeft: Surface, top: Surface, topRight: Surface,
        right: Surface, bottomRight: Surface, bottom: Surface, bottomLeft: Surface
    } {
        return {
            left: this.getSurface(x - 1, y),
            topLeft: this.getSurface(x - 1, y - 1),
            top: this.getSurface(x, y - 1),
            topRight: this.getSurface(x + 1, y - 1),
            right: this.getSurface(x + 1, y),
            bottomRight: this.getSurface(x + 1, y + 1),
            bottom: this.getSurface(x, y + 1),
            bottomLeft: this.getSurface(x - 1, y + 1),
        }
    }

    updateSurfaceMeshes(force: boolean = false) {
        this.forEachSurface((s) => s.updateMesh(force))
        this.worldMgr.sceneMgr.floorGroup.updateWorldMatrix(true, true) // otherwise, ray intersection is not working before rendering
        this.pathFinder.resetGraphsAndCaches()
    }

    dispose() {
        this.forEachSurface(s => s.disposeFromWorld())
    }

    forEachSurface(each: (surface: Surface) => any) {
        this.surfaces?.forEach((r) => r.forEach((s) => each(s)))
    }

    countDiggables(): number {
        let totalDiggables = 0
        this.forEachSurface((s) => totalDiggables += s.surfaceType.digable ? 1 : 0)
        return totalDiggables
    }

    countCrystals(): number {
        let totalCrystals = 0
        this.forEachSurface((s) => totalCrystals += s.containedCrystals)
        return totalCrystals
    }

    countOres(): number {
        let totalOres = 0
        this.forEachSurface((s) => totalOres += s.containedOres + (s.surfaceType === SurfaceType.ORE_SEAM ? s.seamLevel : 0) + (s.surfaceType.digable ? SURFACE_NUM_CONTAINED_ORE : 0))
        return totalOres
    }

    createFallIn(source: Surface, target: Surface) { // TODO Move to scene effects generator class and trigger with event
        const fallInPosition = target.getCenterWorld()
        const heading = Math.atan2(target.y - source.y, source.x - target.x) + Math.PI / 2
        const rockFallAnimName = GameConfig.instance.rockFallStyles.get(this.levelConf.rockFallStyle).tunnel // fall-ins always come from (reinforcable) walls
        this.worldMgr.sceneMgr.addMiscAnim(rockFallAnimName, fallInPosition, heading, false)
        target.makeRubble()
        EventBroker.publish(new LandslideEvent(new PositionComponent(target.getCenterWorld(), target)))
    }

    getFloorPosition(world: Vector2) {
        const p = world.clone().divideScalar(TILESIZE).floor()
        const s = world.clone().divideScalar(TILESIZE).sub(p)
        const dy0 = Math.interpolate(this.getHeightOffset(p.x, p.y), this.getHeightOffset(p.x + 1, p.y), s.x)
        const dy1 = Math.interpolate(this.getHeightOffset(p.x, p.y + 1), this.getHeightOffset(p.x + 1, p.y + 1), s.x)
        const floorY = Math.interpolate(dy0, dy1, s.y) * TILESIZE
        return new Vector3(world.x, floorY, world.y)
    }

    getHeightOffset(x: number, y: number): number {
        return this.heightOffset[x]?.[y] ?? 0
    }

    findClosestWall(position: Vector2): Surface {
        const start = this.getSurfaceFromWorld2D(position)
        const checked: Surface[] = []
        const toCheck: Surface[] = [start]
        while (toCheck.length > 0) {
            const next = toCheck.shift()
            if (next.wallType === WALL_TYPE.WALL) return next
            checked.add(next)
            toCheck.push(...next.neighbors.filter((n) => !checked.includes(n)))
        }
        return null
    }
}
