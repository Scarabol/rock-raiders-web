import { AbstractGameSystem, GameEntity } from '../ECS'
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

const FENCE_RANGE_SQ = TILESIZE / 4 * TILESIZE / 4

export class ElectricFenceSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([PositionComponent, HealthComponent, MonsterStatsComponent, RockMonsterBehaviorComponent])
    beamDelayMs: number = 0

    constructor(readonly worldMgr: WorldManager) {
        super()
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, () => {
            this.beamDelayMs = 0
        })
    }

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        const fenceProtectedSurfaces = this.getFenceProtectedSurfaces()
        const studProtectedSurfaces = this.getStudProtectedSurfaces(fenceProtectedSurfaces)
        if (this.beamDelayMs > 0) {
            this.beamDelayMs -= elapsedMs
        } else {
            this.addBeamEffect(studProtectedSurfaces)
        }
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
        const lwsFilename = short ? GameConfig.instance.miscObjects.ShortElectricFenceBeam : GameConfig.instance.miscObjects.LongElectricFenceBeam
        this.worldMgr.sceneMgr.addMiscAnim(lwsFilename, beamPos, Math.PI / 2, false)
    }

    private addBeamZ(beamPos: Vector3, short: boolean) {
        beamPos.z -= TILESIZE
        const lwsFilename = short ? GameConfig.instance.miscObjects.ShortElectricFenceBeam : GameConfig.instance.miscObjects.LongElectricFenceBeam
        this.worldMgr.sceneMgr.addMiscAnim(lwsFilename, beamPos, 0, false)
    }

    private getFenceProtectedSurfaces(): Surface[] {
        const fenceProtectedSurfaces: Surface[] = []
        const energizedBuildingSurfaces = this.worldMgr.entityMgr.buildings.filter((b) => b.energized)
            .flatMap((b) => b.buildingSurfaces)
        const toCheck = this.worldMgr.entityMgr.placedFences
            .map((f) => this.ecs.getComponents(f.entity).get(PositionComponent))
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
                this.worldMgr.sceneMgr.disposeSceneEntity(s.stud)
                s.stud = null
            }
        })
        toAdd.forEach((s) => {
            s.stud = this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.ElectricFenceStud, s.getCenterWorld(), 0, true)
            this.worldMgr.entityMgr.surfacesWithStuds.add(s)
        })
        return studPositions
    }

    addBeamEffect(studProtectedSurfaces: Surface[]) {
        const longBeams = studProtectedSurfaces.map((surface) => {
            const lwsFilename = GameConfig.instance.miscObjects.LongElectricFenceBeam
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
            const components = this.ecs.getComponents(fence.entity)
            const fenceSurface = components.get(PositionComponent).surface
            const neighbors = fenceSurface.neighbors.filter((n) => !!n.fence || n.building?.primarySurface === n || n.building?.secondarySurface === n)
            neighbors.forEach((n) => {
                const beamHeading = new Vector2(n.y - fenceSurface.y, n.x - fenceSurface.x).angle() // y is actually z axis here
                shortBeams.push({lwsFilename: GameConfig.instance.miscObjects.ShortElectricFenceBeam, beamPos: fenceSurface.getCenterWorld(), beamHeading})
            })
        })
        const beamLocations = [...longBeams, ...shortBeams]
        if (beamLocations.length < 1) return
        const nextBeam = beamLocations.random()
        this.beamDelayMs += Math.randomInclusive(0, 4000)
        this.worldMgr.sceneMgr.addMiscAnim(nextBeam.lwsFilename, nextBeam.beamPos, nextBeam.beamHeading, false)
    }
}
