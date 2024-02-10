import { AbstractGameSystem } from '../ECS'
import { EmergeComponent } from '../component/EmergeComponent'
import { EventBroker } from '../../event/EventBroker'
import { EventKey } from '../../event/EventKeyEnum'
import { EntityType, MonsterEntityType } from '../model/EntityType'
import { LevelSelectedEvent, MonsterEmergeEvent } from '../../event/WorldEvents'
import { PositionComponent } from '../component/PositionComponent'
import { Surface } from '../terrain/Surface'
import { MonsterSpawner } from '../factory/MonsterSpawner'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { AnimEntityActivity, RockMonsterActivity } from '../model/anim/AnimationActivity'
import { RaiderScareComponent, RaiderScareRange } from '../component/RaiderScareComponent'
import { RockMonsterBehaviorComponent } from '../component/RockMonsterBehaviorComponent'
import { GenericMonsterEvent } from '../../event/WorldLocationEvent'

export class EmergeSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([EmergeComponent])

    emergeCreature: MonsterEntityType = EntityType.NONE
    emergeTimeoutMs: number = 0

    constructor() {
        super()
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, (event: LevelSelectedEvent) => {
            this.emergeCreature = event.levelConf.emergeCreature
            this.emergeTimeoutMs = event.levelConf.emergeTimeOutMs
        })
        EventBroker.subscribe(EventKey.MONSTER_EMERGE, (event: MonsterEmergeEvent) => {
            this.emergeFromSurface(event.surface)
        })
    }

    update(entities: Set<number>, dirty: Set<number>, elapsedMs: number): void {
        if (!this.emergeCreature) return
        const busySurfaces = new Set<Surface>()
        ;[...this.ecs.worldMgr.entityMgr.raiders, ...this.ecs.worldMgr.entityMgr.vehicles]
            .forEach((e) => busySurfaces.add(this.ecs.getComponents(e.entity).get(PositionComponent).surface))
        const emergeSpawns: Map<number, Surface[]> = new Map()
        const triggeredEmerges: Set<EmergeComponent> = new Set()
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const emergeComponent = components.get(EmergeComponent)
                if (emergeComponent.emergeDelayMs > 0) {
                    emergeComponent.emergeDelayMs -= elapsedMs
                    continue
                }
                if (emergeComponent.triggerSurface && busySurfaces.has(emergeComponent.triggerSurface)) {
                    triggeredEmerges.add(emergeComponent)
                }
                if (emergeComponent.emergeSurface) {
                    emergeSpawns.getOrUpdate(emergeComponent.emergeSpawnId, () => []).add(emergeComponent.emergeSurface)
                }
            } catch (e) {
                console.error(e)
            }
        }
        triggeredEmerges.forEach((emergeComponent) => {
            emergeSpawns.getOrDefault(emergeComponent.emergeSpawnId, []).forEach((surface) => {
                emergeComponent.emergeDelayMs = this.emergeTimeoutMs
                EventBroker.publish(new MonsterEmergeEvent(surface))
            })
        })
    }

    emergeFromSurface(spawn: Surface) {
        const target = spawn.neighbors.find((n) => n.surfaceType.floor && n.discovered)
        if (!target) return
        const spawnCenter = spawn.getCenterWorld2D()
        const targetCenter = target.getCenterWorld2D()
        const angle = Math.atan2(targetCenter.x - spawnCenter.x, targetCenter.y - spawnCenter.y)
        const monster = MonsterSpawner.spawnMonster(this.ecs.worldMgr, this.emergeCreature, spawnCenter.clone().add(targetCenter).divideScalar(2), angle)
        const components = this.ecs.getComponents(monster)
        const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
        const positionComponent = components.get(PositionComponent)
        sceneEntity.setAnimation(RockMonsterActivity.Emerge, () => {
            sceneEntity.setAnimation(AnimEntityActivity.Stand)
            this.ecs.addComponent(monster, new RaiderScareComponent(RaiderScareRange.ROCKY))
            this.ecs.addComponent(monster, new RockMonsterBehaviorComponent())
        })
        EventBroker.publish(new GenericMonsterEvent(positionComponent))
    }
}
