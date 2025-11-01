import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { BoulderComponent } from '../component/BoulderComponent'
import { Vector2 } from 'three'
import { HealthComponent } from '../component/HealthComponent'
import { EventKey } from '../../event/EventKeyEnum'
import { WorldLocationEvent } from '../../event/WorldEvents'
import { PositionComponent } from '../component/PositionComponent'
import { EntityType } from '../model/EntityType'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { WorldManager } from '../WorldManager'
import { WeaponTypeCfg } from '../../cfg/WeaponTypeCfg'

export class BoulderSystem extends AbstractGameSystem {
    readonly boulders: FilteredEntities = this.addEntityFilter(BoulderComponent)
    readonly boulderStats: WeaponTypeCfg

    constructor(readonly worldMgr: WorldManager) {
        super()
        this.boulderStats = GameConfig.instance.weaponTypes.boulder
    }

    update(ecs: ECS, elapsedMs: number): void {
        for (const [entity, components] of this.boulders) {
            try {
                const boulderComponent = components.get(BoulderComponent)
                const location = new Vector2(boulderComponent.mesh.position.x, boulderComponent.mesh.position.z)
                if (boulderComponent.targetLocation.distanceToSquared(location) > 1) {
                    const step = boulderComponent.targetLocation.clone().sub(location).clampLength(0, elapsedMs / 10)
                    boulderComponent.mesh.position.x += step.x
                    boulderComponent.mesh.position.z += step.y
                } else {
                    const boulderExplode = boulderComponent.entityType === EntityType.BOULDER_ICE ? GameConfig.instance.miscObjects.boulderExplodeIce : GameConfig.instance.miscObjects.boulderExplode
                    this.worldMgr.sceneMgr.addMiscAnim(boulderExplode, boulderComponent.mesh.position, 0, false)
                    const boulderDamage = this.boulderStats.damageByEntityType[boulderComponent.targetBuildingType.entityType]?.[boulderComponent.targetLevel] || this.boulderStats.defaultDamage
                    const buildingComponents = ecs.getComponents(boulderComponent.targetEntity)
                    const healthComponent = buildingComponents.get(HealthComponent)
                    healthComponent.changeHealth(-boulderDamage)
                    if (healthComponent.triggerAlarm) EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_UNDER_ATTACK, buildingComponents.get(PositionComponent)))
                    this.worldMgr.entityMgr.removeEntity(entity)
                    this.worldMgr.sceneMgr.scene.remove(boulderComponent.mesh)
                    ecs.removeEntity(entity)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }
}
