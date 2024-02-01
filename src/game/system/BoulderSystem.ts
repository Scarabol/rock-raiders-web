import { AbstractGameSystem, GameEntity } from '../ECS'
import { BoulderComponent } from '../component/BoulderComponent'
import { Vector2 } from 'three'
import { HealthComponent } from '../component/HealthComponent'
import { UnderAttackEvent } from '../../event/WorldLocationEvent'
import { PositionComponent } from '../component/PositionComponent'
import { EntityType } from '../model/EntityType'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'

export class BoulderSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([BoulderComponent])

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        const boulderStats = GameConfig.instance.weaponTypes.get('boulder')
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const boulderComponent = components.get(BoulderComponent)
                const location = new Vector2(boulderComponent.mesh.position.x, boulderComponent.mesh.position.z)
                if (boulderComponent.targetLocation.distanceToSquared(location) > 1) {
                    const step = boulderComponent.targetLocation.clone().sub(location).clampLength(0, elapsedMs / 10)
                    boulderComponent.mesh.position.x += step.x
                    boulderComponent.mesh.position.z += step.y
                } else {
                    const boulderExplode = boulderComponent.entityType === EntityType.BOULDER_ICE ? GameConfig.instance.miscObjects.BoulderExplodeIce : GameConfig.instance.miscObjects.BoulderExplode
                    this.ecs.worldMgr.sceneMgr.addMiscAnim(boulderExplode, boulderComponent.mesh.position, 0, false)
                    const boulderDamage = boulderStats.damageByEntityType.get(boulderComponent.targetBuildingType.entityType)?.[boulderComponent.targetLevel] || boulderStats.defaultDamage
                    const buildingComponents = this.ecs.getComponents(boulderComponent.targetEntity)
                    const healthComponent = buildingComponents.get(HealthComponent)
                    healthComponent.changeHealth(-boulderDamage)
                    if (healthComponent.triggerAlarm) EventBroker.publish(new UnderAttackEvent(buildingComponents.get(PositionComponent)))
                    this.ecs.worldMgr.entityMgr.removeEntity(entity)
                    this.ecs.worldMgr.sceneMgr.scene.remove(boulderComponent.mesh)
                    this.ecs.removeEntity(entity)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
