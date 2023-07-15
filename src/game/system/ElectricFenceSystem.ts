import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { HealthComponent } from '../component/HealthComponent'
import { WorldManager } from '../WorldManager'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { TILESIZE } from '../../params'
import { RockMonsterBehaviorComponent } from '../component/RockMonsterBehaviorComponent'
import { ResourceManager } from '../../resource/ResourceManager'
import { Surface } from '../terrain/Surface'
import { Vector3 } from 'three'

const FENCE_RANGE_SQ = TILESIZE / 4 * TILESIZE / 4

export class ElectricFenceSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([PositionComponent, HealthComponent, MonsterStatsComponent, RockMonsterBehaviorComponent])
    beamDelayMs: number = 0

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        const fenceProtectedSurfaces = this.getFenceProtectedSurfaces()
        const studProtectedSurfaces = this.getStudProtectedSurfaces(fenceProtectedSurfaces)
        this.addBeamEffect(elapsedMs, studProtectedSurfaces)
        fenceProtectedSurfaces.add(...studProtectedSurfaces)
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                if (!components.get(MonsterStatsComponent).stats.CanBeHitByFence) continue
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
                    } // XXX else spawn beam to random fence neighbor
                })
            } catch
                (e) {
                console.error(e)
            }
        }
    }

    private addBeamX(beamPos: Vector3, short: boolean) {
        beamPos.x -= TILESIZE
        const lwsFilename = short ? ResourceManager.configuration.miscObjects.ShortElectricFenceBeam : ResourceManager.configuration.miscObjects.LongElectricFenceBeam
        this.worldMgr.sceneMgr.addMiscAnim(lwsFilename, beamPos, Math.PI / 2, false)
    }

    private addBeamZ(beamPos: Vector3, short: boolean) {
        beamPos.z -= TILESIZE
        const lwsFilename = short ? ResourceManager.configuration.miscObjects.ShortElectricFenceBeam : ResourceManager.configuration.miscObjects.LongElectricFenceBeam
        this.worldMgr.sceneMgr.addMiscAnim(lwsFilename, beamPos, 0, false)
    }

    private getFenceProtectedSurfaces(): Surface[] {
        const fenceProtectedSurfaces: Surface[] = []
        const energizedBuildingSurfaces = this.worldMgr.entityMgr.buildings.filter((b) => b.energized)
            .flatMap((b) => b.surfaces)
        const toCheck = this.worldMgr.entityMgr.placedFences
            .map((f) => this.worldMgr.ecs.getComponents(f.entity).get(PositionComponent))
        energizedBuildingSurfaces.forEach((s) => {
            [[2, 0], [1, 0], [0, 2], [0, 1], [-2, 0], [-1, 0], [0, -2], [0, -1]].forEach((o) => {
                const next = this.worldMgr.sceneMgr.terrain.getSurface(s.x + o[0], s.y + o[1])
                if (next.fence) {
                    const positionComponent = this.ecs.getComponents(next.fence).get(PositionComponent)
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
                        ((target.fence && fenceProtectedSurfaces.includes(target)) || (target.building && target.energized)))
                ) {
                    studPositions.add(possibleStud)
                    if (!possibleStud.stud) toAdd.add(possibleStud)
                }
            })
        })
        ;[...this.worldMgr.entityMgr.surfacesWithStuds].forEach((s) => {
            if (!studPositions.includes(s)) {
                this.worldMgr.entityMgr.surfacesWithStuds.remove(s)
                this.worldMgr.sceneMgr.removeMiscAnim(s.stud)
                s.stud = null
            }
        })
        toAdd.forEach((s) => {
            s.stud = this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.ElectricFenceStud, s.getCenterWorld(), 0, true)
            this.worldMgr.entityMgr.surfacesWithStuds.add(s)
        })
        return studPositions
    }

    addBeamEffect(elapsedMs: number, studProtectedSurfaces: Surface[]) {
        if (this.beamDelayMs > 0) {
            this.beamDelayMs -= elapsedMs
            return
        }
        if (studProtectedSurfaces.length < 1) return
        this.beamDelayMs = Math.randomInclusive(2000, 10000)
        // TODO add short beams between fences and between fences and buildings
        const f = studProtectedSurfaces.random()
        const sy1 = this.worldMgr.sceneMgr.terrain.getSurface(f.x - 1, f.y)
        const sy2 = this.worldMgr.sceneMgr.terrain.getSurface(f.x + 1, f.y)
        if ((sy1.fence || sy1.building) && (sy2.fence || sy2.building)) {
            this.addBeamX(f.getCenterWorld(), false)
        } else {
            this.addBeamZ(f.getCenterWorld(), false)
        }
    }
}
