import { AxesHelper, Group, Vector2, Vector3 } from 'three'
import { LevelEntryCfg } from '../../../cfg/LevelsCfg'
import { TextureEntryCfg } from '../../../cfg/TexturesCfg'
import { DEV_MODE, SURFACE_NUM_CONTAINED_ORE, TILESIZE } from '../../../params'
import { WorldManager } from '../../WorldManager'
import { updateSafe } from '../Updateable'
import { FallIn } from './FallIn'
import { LavaErosion } from './LavaErosion'
import { PathFinder } from './PathFinder'
import { PowerGrid } from './PowerGrid'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'
import { ResourceManager } from '../../../resource/ResourceManager'
import { Sample } from '../../../audio/Sample'

export class Terrain {
    heightOffset: number[][] = [[]]
    textureSet: TextureEntryCfg = null
    rockFallStyle: string = null
    width: number = 0
    height: number = 0
    surfaces: Surface[][] = []
    floorGroup: Group = new Group()
    roofGroup: Group = new Group()
    pathFinder: PathFinder = new PathFinder()
    fallIns: FallIn[] = []
    powerGrid: PowerGrid = new PowerGrid()
    erodeTriggerTimeMs: number = 0
    lavaErodes: LavaErosion[] = []

    constructor(readonly worldMgr: WorldManager, readonly levelConf: LevelEntryCfg) {
        this.worldMgr.sceneMgr.terrain = this
        this.worldMgr.sceneMgr.scene.add(this.floorGroup)
        this.floorGroup.scale.setScalar(TILESIZE)
        if (DEV_MODE) this.floorGroup.add(new AxesHelper())
        this.roofGroup.scale.setScalar(TILESIZE)
        this.roofGroup.visible = false // keep roof hidden unless switched to other camera
        this.erodeTriggerTimeMs = levelConf.erodeTriggerTime * 1000
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
        this.floorGroup.updateWorldMatrix(true, true) // otherwise, ray intersection is not working before rendering
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

    setFallInLevel(x: number, y: number, fallInLevel: number) {
        if (fallInLevel < 1) return
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
        const fallInPosition = target.getCenterWorld()
        const heading = Math.atan2(target.y - source.y, source.x - target.x) + Math.PI / 2
        const rockFallAnimName = ResourceManager.configuration.rockFallStyles[this.rockFallStyle][3] // TODO not always pick "tunnel"
        this.worldMgr.addMiscAnim(rockFallAnimName, fallInPosition, heading)
        source.playPositionalSample(Sample.SFX_RockBreak)
        target.makeRubble()
    }

    removeFallInOrigin(surface: Surface) {
        this.fallIns = this.fallIns.filter((f) => f.source !== surface)
    }

    addLavaErosion(x: number, y: number, erosionLevel: number) {
        this.lavaErodes.push(new LavaErosion(this.getSurface(x, y), erosionLevel, this.levelConf.erodeErodeTime * 1000, this.levelConf.erodeLockTime * 1000))
    }

    update(elapsedMs: number) {
        this.fallIns.forEach((f) => updateSafe(f, elapsedMs))
        if (this.erodeTriggerTimeMs > elapsedMs) {
            this.erodeTriggerTimeMs -= elapsedMs
        } else {
            this.lavaErodes = this.lavaErodes.filter((e) => e.surface.surfaceType !== SurfaceType.LAVA5)
            this.lavaErodes.forEach((e) => updateSafe(e, elapsedMs - this.erodeTriggerTimeMs))
            this.erodeTriggerTimeMs = 0
        }
    }

    getFloorPosition(world: Vector2) {
        const p = world.clone().divideScalar(TILESIZE).floor()
        const s = world.clone().divideScalar(TILESIZE).sub(p)
        const interpolate = (y0: number, y1: number, x: number): number => y0 + x * (y1 - y0)
        const dy0 = interpolate(this.heightOffset[p.x][p.y], this.heightOffset[p.x + 1][p.y], s.x)
        const dy1 = interpolate(this.heightOffset[p.x][p.y + 1], this.heightOffset[p.x + 1][p.y + 1], s.x)
        const floorY = interpolate(dy0, dy1, s.y) * TILESIZE
        return new Vector3(world.x, floorY, world.y)
    }
}
