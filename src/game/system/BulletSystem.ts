import { AbstractGameSystem, ECS, GameEntity } from '../ECS'
import { BulletComponent } from '../component/BulletComponent'
import { WorldManager } from '../WorldManager'
import { Vector2 } from 'three'
import { EntityType } from '../model/EntityType'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { PositionComponent } from '../component/PositionComponent'
import { HealthComponent } from '../component/HealthComponent'
import { EntityFrozenComponent } from '../component/EntityFrozenComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { EntityPushedComponent } from '../component/EntityPushedComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { HeadingComponent } from '../component/HeadingComponent'
import { GameConfig } from '../../cfg/GameConfig'

export class BulletSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([BulletComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(ecs: ECS, elapsedMs: number, entities: Set<GameEntity>, _dirty: Set<GameEntity>): void {
        const targets = [...this.worldMgr.entityMgr.rockMonsters, ...this.worldMgr.entityMgr.slugs]
            .map((e) => {
                const components = ecs.getComponents(e)
                return {
                    entity: e,
                    stats: components.get(MonsterStatsComponent)?.stats,
                    pos: components.get(PositionComponent),
                    health: components.get(HealthComponent),
                    heading: components.get(AnimatedSceneEntityComponent).sceneEntity.rotation.y,
                }
            }).filter((t) => t.health.health > 0)
        for (const entity of entities) {
            try {
                const components = ecs.getComponents(entity)
                const bulletComponent = components.get(BulletComponent)
                const location = new Vector2(bulletComponent.bulletAnim.position.x, bulletComponent.bulletAnim.position.z)
                if (bulletComponent.targetLocation.distanceToSquared(location) > 1) {
                    const step = bulletComponent.targetLocation.clone().sub(location).clampLength(0, elapsedMs / 10)
                    bulletComponent.bulletAnim.position.x += step.x
                    bulletComponent.bulletAnim.position.z += step.y
                    targets.some((t) => {
                        const targetStats = t.stats
                        if (!targetStats.canBeShotAt) return false
                        const targetLocation = t.pos.getPosition2D()
                        const bulletPos = bulletComponent.bulletAnim.position
                        const bulletLocation = new Vector2(bulletPos.x, bulletPos.z)
                        if (targetLocation.distanceToSquared(bulletLocation) >= Math.pow(targetStats.collRadius, 2)) return false
                        if (bulletComponent.bulletType === EntityType.LASER_SHOT) {
                            this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.lazerHit, t.pos.position, 0, false)
                            t.health.changeHealth(-targetStats.laserDamage)
                        } else if (bulletComponent.bulletType === EntityType.FREEZER_SHOT) {
                            this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.freezerHit, t.pos.position, 0, false)
                            t.health.changeHealth(-targetStats.freezerDamage)
                            if (targetStats.canFreeze && !ecs.getComponents(t.entity).has(EntityFrozenComponent)) {
                                const entityFrozenComponent = new EntityFrozenComponent(this.worldMgr, t.entity, targetStats.freezerTimeMs, t.pos.position, t.heading)
                                ecs.removeComponent(t.entity, WorldTargetComponent)
                                ecs.removeComponent(t.entity, HeadingComponent)
                                ecs.addComponent(t.entity, entityFrozenComponent)
                            }
                        } else if (bulletComponent.bulletType === EntityType.PUSHER_SHOT) {
                            this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.pusherHit, t.pos.position, 0, false)
                            t.health.changeHealth(-targetStats.pusherDamage)
                            if (targetStats.canPush && !ecs.getComponents(t.entity).has(EntityPushedComponent)) {
                                ecs.removeComponent(t.entity, WorldTargetComponent)
                                ecs.removeComponent(t.entity, HeadingComponent)
                                const pushTarget = t.pos.getPosition2D().add(step.clone().setLength(targetStats.pusherDist))
                                ecs.addComponent(t.entity, new WorldTargetComponent(pushTarget, 1))
                                ecs.addComponent(t.entity, new EntityPushedComponent())
                            }
                        }
                        this.worldMgr.entityMgr.removeEntity(entity)
                        this.worldMgr.sceneMgr.disposeSceneEntity(bulletComponent.bulletAnim)
                        ecs.removeEntity(entity)
                        return true
                    })
                } else {
                    this.worldMgr.entityMgr.removeEntity(entity)
                    this.worldMgr.sceneMgr.disposeSceneEntity(bulletComponent.bulletAnim)
                    ecs.removeEntity(entity)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
