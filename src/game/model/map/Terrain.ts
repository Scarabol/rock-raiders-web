import { AxesHelper, Group, Vector2, Vector3 } from 'three'
import { TextureEntryCfg } from '../../../cfg/TexturesCfg'
import { DEV_MODE, SURFACE_NUM_CONTAINED_ORE, TILESIZE } from '../../../params'
import { EntityManager } from '../../EntityManager'
import { SceneManager } from '../../SceneManager'
import { updateSafe } from '../Updateable'
import { FallIn } from './FallIn'
import { PathFinder } from './PathFinder'
import { PowerGrid } from './PowerGrid'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'

export class Terrain {
    sceneMgr: SceneManager
    entityMgr: EntityManager
    textureSet: TextureEntryCfg = null
    width: number = 0
    height: number = 0
    surfaces: Surface[][] = []
    floorGroup: Group = new Group()
    roofGroup: Group = new Group()
    pathFinder: PathFinder = new PathFinder()
    fallIns: FallIn[] = []
    powerGrid: PowerGrid = new PowerGrid()

    constructor(sceneMgr: SceneManager, entityMgr: EntityManager) {
        this.sceneMgr = sceneMgr
        this.sceneMgr.terrain = this
        this.sceneMgr.scene.add(this.floorGroup)
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

    getSurface(x: number, y: number): Surface {
        x = Math.floor(x)
        y = Math.floor(y)
        return this.getSurfaceOrNull(x, y) || new Surface(this, SurfaceType.SOLID_ROCK, x, y, 0)
    }

    getSurfaceOrNull(x: number, y: number): Surface | null {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.surfaces[x][y]
        } else {
            return null
        }
    }

    updateSurfaceMeshes(force: boolean = false) {
        this.forEachSurface((s) => s.updateMesh(force))
        this.floorGroup.updateWorldMatrix(true, true) // otherwise ray intersection is not working before rendering
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
        const heading = Math.atan2(target.y - source.y, source.x - target.x) + Math.PI / 2
        this.entityMgr.addMiscAnim('MiscAnims/RockFall/Rock3Sides.lws', this.sceneMgr, fallinPosition, heading)
        target.makeRubble()
    }

    removeFallInOrigin(surface: Surface) {
        this.fallIns = this.fallIns.filter((f) => f.source !== surface)
    }

    update(elapsedMs: number) {
        this.fallIns.forEach((f) => updateSafe(f, elapsedMs))
    }
}
