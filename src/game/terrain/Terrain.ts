import { AxesHelper, Group, Vector2, Vector3 } from 'three'
import { LevelEntryCfg } from '../../cfg/LevelsCfg'
import { TextureEntryCfg } from '../../cfg/TexturesCfg'
import { DEV_MODE, SURFACE_NUM_CONTAINED_ORE, TILESIZE } from '../../params'
import { WorldManager } from '../WorldManager'
import { updateSafe } from '../model/Updateable'
import { FallIn } from './FallIn'
import { PathFinder } from './PathFinder'
import { Surface } from './Surface'
import { SurfaceType } from './SurfaceType'
import { Sample } from '../../audio/Sample'
import { GenericMonsterEvent, LandslideEvent } from '../../event/WorldLocationEvent'
import { PositionComponent } from '../component/PositionComponent'
import { EntityType, MonsterEntityType } from '../model/EntityType'
import { EmergeTrigger } from './EmergeTrigger'
import { MonsterSpawner } from '../factory/MonsterSpawner'
import { AnimEntityActivity, RockMonsterActivity } from '../model/anim/AnimationActivity'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { RockMonsterBehaviorComponent } from '../component/RockMonsterBehaviorComponent'
import { WALL_TYPE } from './WallType'
import { RaiderScareComponent, RaiderScareRange } from '../component/RaiderScareComponent'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'

export class Terrain {
    heightOffset: number[][] = [[]]
    textureSet: TextureEntryCfg = null
    rockFallStyle: string = null
    width: number = 0
    height: number = 0
    surfaces: Surface[][] = []
    floorGroup: Group = new Group()
    pathFinder: PathFinder = new PathFinder(this.surfaces)
    fallIns: FallIn[] = []
    tutoBlocksById: Map<number, Surface[]> = new Map()
    emergeCreature: MonsterEntityType = EntityType.NONE
    emergeTrigger: EmergeTrigger[] = []
    emergeSpawns: Map<number, Surface[]> = new Map()
    emergeTimeoutMs: number = 0
    slugHoles: Surface[] = []
    rechargeSeams: Surface[] = []

    constructor(readonly worldMgr: WorldManager, readonly levelConf: LevelEntryCfg) {
        this.floorGroup.scale.setScalar(TILESIZE)
        if (DEV_MODE) this.floorGroup.add(new AxesHelper())
        this.emergeTimeoutMs = levelConf.emergeTimeOut / 1500 * 60 * 1000 // 1500 specifies 1 minute
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

    setFallInLevel(x: number, y: number, maxTimerSeconds: number) {
        if (maxTimerSeconds < 1) return
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
            this.fallIns.push(new FallIn(this, originPos, targetPos, maxTimerSeconds))
        }
    }

    findFallInOrigin(target: Surface): Surface {
        const s = target.neighbors.find((n) => n.isReinforcable())
        if (!s) return null
        return s
    }

    findFallInTarget(source: Surface): Surface {
        return source.neighbors.find((n) => n.isWalkable() && !n.surfaceType.hasErosion)
    }

    createFallIn(source: Surface, target: Surface) {
        const fallInPosition = target.getCenterWorld()
        const heading = Math.atan2(target.y - source.y, source.x - target.x) + Math.PI / 2
        const rockFallAnimName = GameConfig.instance.rockFallStyles[this.rockFallStyle][3] // TODO not always pick "tunnel"
        this.worldMgr.sceneMgr.addMiscAnim(rockFallAnimName, fallInPosition, heading, false)
        source.playPositionalSample(Sample.SFX_RockBreak)
        target.makeRubble()
        EventBroker.publish(new LandslideEvent(new PositionComponent(target.getCenterWorld(), target)))
    }

    removeFallInOrigin(surface: Surface) {
        this.fallIns = this.fallIns.filter((f) => f.source !== surface)
    }

    removeEmergeSpawn(surface: Surface) {
        this.emergeSpawns.forEach((spawns) => spawns.remove(surface))
    }

    update(elapsedMs: number) {
        this.fallIns.forEach((f) => updateSafe(f, elapsedMs))
        if (this.emergeCreature) this.updateEmergeTrigger(elapsedMs)
    }

    private updateEmergeTrigger(elapsedMs: number) {
        const failedEmergeTrigger: EmergeTrigger[] = []
        this.emergeTrigger.forEach((t) => {
            try {
                if (t.emergeDelayMs > 0) {
                    t.emergeDelayMs -= elapsedMs
                    return
                }
                const isTriggered = [...this.worldMgr.entityMgr.raiders, ...this.worldMgr.entityMgr.vehicles]
                    .some((e) => this.worldMgr.ecs.getComponents(e.entity).get(PositionComponent).surface === t.triggerSurface)
                if (!isTriggered) return
                this.emergeSpawns.getOrDefault(t.emergeSpawnId, []).forEach((spawn) => {
                    t.emergeDelayMs = this.emergeTimeoutMs
                    this.emergeFromSurface(spawn)
                })
            } catch (e) {
                console.error(e)
                failedEmergeTrigger.push(t)
            }
        })
        failedEmergeTrigger.forEach((t) => this.emergeTrigger.remove(t))
    }

    emergeFromSurface(spawn: Surface) {
        const target = spawn.neighbors.find((n) => n.surfaceType.floor && n.discovered)
        if (!target) return
        const spawnCenter = spawn.getCenterWorld2D()
        const targetCenter = target.getCenterWorld2D()
        const angle = -targetCenter.angleTo(spawnCenter) + Math.PI / 2
        const monster = MonsterSpawner.spawnMonster(this.worldMgr, this.emergeCreature, spawnCenter.clone().add(targetCenter).divideScalar(2), angle)
        const components = this.worldMgr.ecs.getComponents(monster)
        const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
        const positionComponent = components.get(PositionComponent)
        sceneEntity.setAnimation(RockMonsterActivity.Emerge, () => {
            sceneEntity.setAnimation(AnimEntityActivity.Stand)
            this.worldMgr.ecs.addComponent(monster, new RaiderScareComponent(RaiderScareRange.ROCKY))
            this.worldMgr.ecs.addComponent(monster, new RockMonsterBehaviorComponent())
        })
        EventBroker.publish(new GenericMonsterEvent(positionComponent))
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
