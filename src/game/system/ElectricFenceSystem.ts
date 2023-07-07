import { AbstractGameSystem, GameEntity } from '../ECS'
import { PositionComponent } from '../component/PositionComponent'
import { HealthComponent } from '../component/HealthComponent'
import { WorldManager } from '../WorldManager'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { TILESIZE } from '../../params'
import { RockMonsterBehaviorComponent } from '../component/RockMonsterBehaviorComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { RockMonsterActivity } from '../model/anim/AnimationActivity'
import { ResourceManager } from '../../resource/ResourceManager'
import { Surface } from '../terrain/Surface'

const FENCE_RANGE_SQ = TILESIZE / 2 * TILESIZE / 2

export class ElectricFenceSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([PositionComponent, HealthComponent, MonsterStatsComponent, RockMonsterBehaviorComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        const fenceProtectedSurfaces = this.getFenceProtectedSurfaces()
        const studProtectedSurfaces = this.getStudProtectedSurfaces(fenceProtectedSurfaces)
        fenceProtectedSurfaces.push(...studProtectedSurfaces)
        // TODO spawn lightning beams
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                if (!components.get(MonsterStatsComponent).stats.CanBeHitByFence) continue
                const positionComponent = components.get(PositionComponent)
                fenceProtectedSurfaces.forEach((f) => {
                    if (f.getCenterWorld2D().distanceToSquared(positionComponent.getPosition2D()) >= FENCE_RANGE_SQ) return
                    components.get(HealthComponent).changeHealth(-100)
                    this.ecs.removeComponent(entity, WorldTargetComponent)
                    this.ecs.removeComponent(entity, RockMonsterBehaviorComponent)
                    const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
                    sceneEntity.setAnimation(RockMonsterActivity.Crumble, () => {
                        this.worldMgr.sceneMgr.removeMeshGroup(sceneEntity)
                        this.worldMgr.entityMgr.removeEntity(entity)
                        this.ecs.removeEntity(entity)
                        sceneEntity.dispose()
                        // TODO remove monster world location event, if still exists
                    })
                })
            } catch
                (e) {
                console.error(e)
            }
        }
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
                    fenceProtectedSurfaces.push(positionComponent.surface)
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
                        fenceProtectedSurfaces.push(positionComponent.surface)
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
        fenceProtectedSurfaces.forEach((p) => {
            p.neighbors.forEach((n) => {
                if (!n.fence && !studPositions.includes(n) && n.neighbors.some((n2) => n2 !== p && n2.fence && fenceProtectedSurfaces.includes(n2))) {
                    studPositions.push(n)
                    if (!n.stud) toAdd.push(n)
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
}
