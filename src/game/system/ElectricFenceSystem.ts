import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { HealthComponent } from '../component/HealthComponent'
import { WorldManager } from '../WorldManager'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { TILESIZE } from '../../params'
import { RockMonsterBehaviorComponent } from '../component/RockMonsterBehaviorComponent'
import { Surface } from '../terrain/Surface'
import { Vector2, Vector3 } from 'three'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { EventKey } from '../../event/EventKeyEnum'
import { PRNG } from '../factory/PRNG'

const FENCE_RANGE_SQ = TILESIZE / 4 * TILESIZE / 4

export class ElectricFenceSystem extends AbstractGameSystem {
    readonly eligibleMonsters: FilteredEntities = this.addEntityFilter(PositionComponent, HealthComponent, MonsterStatsComponent, RockMonsterBehaviorComponent)
    beamDelayMs: number = 0

    constructor(readonly worldMgr: WorldManager) {
        super()
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, () => {
            this.beamDelayMs = 0
        })
    }

    update(ecs: ECS, elapsedMs: number): void {
        const fenceProtectedSurfaces = this.getFenceProtectedSurfaces(ecs)
        const studProtectedSurfaces = this.getStudProtectedSurfaces(fenceProtectedSurfaces)
        if (this.beamDelayMs > 0) {
            this.beamDelayMs -= elapsedMs
        } else {
            this.addBeamEffect(ecs, studProtectedSurfaces)
        }
        fenceProtectedSurfaces.add(...studProtectedSurfaces)
        for (const [_entity, components] of this.eligibleMonsters) {
            try {
                if (!components.get(MonsterStatsComponent).stats.canBeHitByFence) continue
                const positionComponent = components.get(PositionComponent)
                fenceProtectedSurfaces.forEach((f) => {
                    if (f.getCenterWorld2D().distanceToSquared(positionComponent.getPosition2D()) >= FENCE_RANGE_SQ) return
                    components.get(HealthComponent).changeHealth(-100)
                    if (!f.fence) {
                        if (this.worldMgr.sceneMgr.terrain.getSurface(f.x - 1, f.y).fence && this.worldMgr.sceneMgr.terrain.getSurface(f.x + 1, f.y).fence) {
                            this.addBeamX(f.getCenterWorld(), false)
                        } else {
                            this.addBeamZ(f.getCenterWorld(), false)
                        }
                    }
                })
            } catch
                (e) {
                console.error(e)
            }
        }
    }

    private addBeamX(beamPos: Vector3, short: boolean) {
        beamPos.x -= TILESIZE
        const lwsFilename = short ? GameConfig.instance.miscObjects.shortElectricFenceBeam : GameConfig.instance.miscObjects.longElectricFenceBeam
        this.worldMgr.sceneMgr.addMiscAnim(lwsFilename, beamPos, Math.PI / 2, false)
    }

    private addBeamZ(beamPos: Vector3, short: boolean) {
        beamPos.z -= TILESIZE
        const lwsFilename = short ? GameConfig.instance.miscObjects.shortElectricFenceBeam : GameConfig.instance.miscObjects.longElectricFenceBeam
        this.worldMgr.sceneMgr.addMiscAnim(lwsFilename, beamPos, 0, false)
    }

    private getFenceProtectedSurfaces(ecs: ECS): Surface[] {
        const fenceProtectedSurfaces: Surface[] = []
        const energizedBuildingSurfaces = this.worldMgr.entityMgr.buildings.filter((b) => b.energized) // TODO Replace with entity filter once energy system is implemented
            .flatMap((b) => b.buildingSurfaces)
        const toCheck = this.worldMgr.entityMgr.placedFences // TODO Replace with entity filter
            .map((f) => ecs.getComponents(f.entity).get(PositionComponent))
        energizedBuildingSurfaces.forEach((s) => {
            [[2, 0], [1, 0], [0, 2], [0, 1], [-2, 0], [-1, 0], [0, -2], [0, -1]].forEach((o) => {
                const next = this.worldMgr.sceneMgr.terrain.getSurface(s.x + o[0], s.y + o[1])
                if (next.fence) {
                    const positionComponent = ecs.getComponents(next.fence).get(PositionComponent)
                    toCheck.remove(positionComponent)
                    fenceProtectedSurfaces.add(positionComponent.surface)
                }
            })
        })
        let changed = fenceProtectedSurfaces.length > 0
        while (changed) {
            changed = toCheck.some((positionComponent) => {
                return fenceProtectedSurfaces.some((activeSurface) => {
                    const distance = Math.abs(activeSurface.x - positionComponent.surface.x) + Math.abs(activeSurface.y - positionComponent.surface.y)
                    if (distance <= 2) {
                        toCheck.remove(positionComponent)
                        fenceProtectedSurfaces.add(positionComponent.surface)
                        return true
                    }
                    return false
                })
            })
        }
        return fenceProtectedSurfaces
    }

    private getStudProtectedSurfaces(fenceProtectedSurfaces: Surface[]): Surface[] {
        const studPositions: Surface[] = []
        const toAdd: Surface[] = []
        fenceProtectedSurfaces.forEach((origin) => {
            origin.neighbors.forEach((possibleStud) => {
                if (!possibleStud.fence && !possibleStud.building && !studPositions.includes(possibleStud) &&
                    possibleStud.neighbors.some((target) => target !== origin && (target.x === origin.x || target.y === origin.y) &&
                        ((target.fence && fenceProtectedSurfaces.includes(target)) ||
                            (target.energized && (target === target.building?.primarySurface || target === target.building?.secondarySurface))))
                ) {
                    studPositions.add(possibleStud)
                    if (!possibleStud.stud) toAdd.add(possibleStud)
                }
            })
        })
        ;[...this.worldMgr.entityMgr.surfacesWithStuds].forEach((s) => {
            if (!studPositions.includes(s)) {
                this.worldMgr.entityMgr.surfacesWithStuds.remove(s)
                if (s.stud) this.worldMgr.sceneMgr.disposeSceneEntity(s.stud)
                s.stud = undefined
            }
        })
        toAdd.forEach((s) => {
            s.stud = this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.electricFenceStud, s.getCenterWorld(), 0, true)
            this.worldMgr.entityMgr.surfacesWithStuds.add(s)
        })
        return studPositions
    }

    addBeamEffect(ecs: ECS, studProtectedSurfaces: Surface[]) {
        const longBeams = studProtectedSurfaces.map((surface) => {
            const lwsFilename = GameConfig.instance.miscObjects.longElectricFenceBeam
            const beamPos = surface.getCenterWorld()
            const surfaceLeft = this.worldMgr.sceneMgr.terrain.getSurface(surface.x - 1, surface.y)
            const surfaceRight = this.worldMgr.sceneMgr.terrain.getSurface(surface.x + 1, surface.y)
            let beamHeading = 0
            if ((surfaceLeft.fence || surfaceLeft.building) && (surfaceRight.fence || surfaceRight.building)) {
                beamPos.x -= TILESIZE
                beamHeading = Math.PI / 2
            } else {
                beamPos.z -= TILESIZE
            }
            return {lwsFilename, beamPos, beamHeading}
        })
        const shortBeams: { lwsFilename: string, beamPos: Vector3, beamHeading: number }[] = []
        this.worldMgr.entityMgr.placedFences.forEach((fence) => {
            const components = ecs.getComponents(fence.entity)
            const fenceSurface = components.get(PositionComponent).surface
            const neighbors = fenceSurface.neighbors.filter((n) => !!n.fence || n.building?.primarySurface === n || n.building?.secondarySurface === n)
            neighbors.forEach((n) => {
                const beamHeading = new Vector2(n.y - fenceSurface.y, n.x - fenceSurface.x).angle() // y is actually z axis here
                shortBeams.push({lwsFilename: GameConfig.instance.miscObjects.shortElectricFenceBeam, beamPos: fenceSurface.getCenterWorld(), beamHeading})
            })
        })
        const nextBeam = PRNG.animation.sample([...longBeams, ...shortBeams])
        if (!nextBeam) return
        this.beamDelayMs += PRNG.animation.randInt(4000)
        this.worldMgr.sceneMgr.addMiscAnim(nextBeam.lwsFilename, nextBeam.beamPos, nextBeam.beamHeading, false)
    }
}
