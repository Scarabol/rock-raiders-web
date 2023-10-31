import { AbstractGameSystem, GameEntity } from '../ECS'
import { BulletComponent } from '../component/BulletComponent'
import { WorldManager } from '../WorldManager'
import { Vector2 } from 'three'
import { EntityType } from '../model/EntityType'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { PositionComponent } from '../component/PositionComponent'
import { HealthComponent } from '../component/HealthComponent'
import { ResourceManager } from '../../resource/ResourceManager'
import { EntityFrozenComponent } from '../component/EntityFrozenComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { EntityPushedComponent } from '../component/EntityPushedComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'

export class BulletSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([BulletComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        const targets = [...this.worldMgr.entityMgr.rockMonsters, ...this.worldMgr.entityMgr.slugs]
            .map((e) => {
                const components = this.ecs.getComponents(e)
                return {
                    entity: e,
                    stats: components.get(MonsterStatsComponent)?.stats,
                    pos: components.get(PositionComponent),
                    health: components.get(HealthComponent),
                    heading: components.get(AnimatedSceneEntityComponent).sceneEntity.rotation.y,
                }
            }).filter((t) => !!t.stats && !!t.pos && !!t.health && t.health.health > 0)
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const bulletComponent = components.get(BulletComponent)
                const location = new Vector2(bulletComponent.bulletAnim.position.x, bulletComponent.bulletAnim.position.z)
                if (bulletComponent.targetLocation.distanceToSquared(location) > 1) {
                    const step = bulletComponent.targetLocation.clone().sub(location).clampLength(0, elapsedMs / 10)
                    bulletComponent.bulletAnim.position.x += step.x
                    bulletComponent.bulletAnim.position.z += step.y
                    targets.some((t) => {
                        const targetStats = t.stats
                        if (!targetStats.CanBeShotAt) return false
                        const targetLocation = t.pos.getPosition2D()
                        const bulletPos = bulletComponent.bulletAnim.position
                        const bulletLocation = new Vector2(bulletPos.x, bulletPos.z)
                        if (targetLocation.distanceToSquared(bulletLocation) >= targetStats.CollRadiusSq) return false
                        if (bulletComponent.bulletType === EntityType.LASER_SHOT) {
                            this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.LazerHit, t.pos.position, 0, false)
                            t.health.changeHealth(-targetStats.LaserDamage)
                        } else if (bulletComponent.bulletType === EntityType.FREEZER_SHOT) {
                            this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.FreezerHit, t.pos.position, 0, false)
                            t.health.changeHealth(-targetStats.FreezerDamage)
                            if (targetStats.CanFreeze && !this.ecs.getComponents(t.entity).has(EntityFrozenComponent)) {
                                const entityFrozenComponent = new EntityFrozenComponent(this.worldMgr, t.entity, targetStats.FreezerTimeMs, t.pos.position, t.heading)
                                this.ecs.removeComponent(t.entity, WorldTargetComponent)
                                this.ecs.addComponent(t.entity, entityFrozenComponent)
                            }
                        } else if (bulletComponent.bulletType === EntityType.PUSHER_SHOT) {
                            this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.PusherHit, t.pos.position, 0, false)
                            t.health.changeHealth(-targetStats.PusherDamage)
                            if (targetStats.CanPush && !this.ecs.getComponents(t.entity).has(EntityPushedComponent)) {
                                this.ecs.removeComponent(t.entity, WorldTargetComponent)
                                const pushTarget = t.pos.getPosition2D().add(step.clone().setLength(t.stats.PusherDist))
                                this.ecs.addComponent(t.entity, new WorldTargetComponent(pushTarget, 1, false))
                                this.ecs.addComponent(t.entity, new EntityPushedComponent())
                            }
                        }
                        this.worldMgr.entityMgr.removeEntity(entity)
                        this.worldMgr.sceneMgr.removeMiscAnim(bulletComponent.bulletAnim)
                        this.ecs.removeEntity(entity)
                        return true
                    })
                } else {
                    this.worldMgr.entityMgr.removeEntity(entity)
                    this.worldMgr.sceneMgr.removeMiscAnim(bulletComponent.bulletAnim)
                    this.ecs.removeEntity(entity)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
