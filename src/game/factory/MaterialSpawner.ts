import { WorldManager } from '../WorldManager'
import { Vector2 } from 'three'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { Surface } from '../terrain/Surface'
import { EntityType, MaterialEntityType } from '../model/EntityType'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneSelectionComponent } from '../component/SceneSelectionComponent'
import { BuildingSite } from '../model/building/BuildingSite'
import { PositionComponent } from '../component/PositionComponent'
import { BARRIER_ACTIVITY, DYNAMITE_ACTIVITY } from '../model/anim/AnimationActivity'
import { PRIORITY_IDENTIFIER } from '../model/job/PriorityIdentifier'
import { RAIDER_TRAINING } from '../model/raider/RaiderTraining'
import { HealthComponent } from '../component/HealthComponent'
import { LastWillComponent } from '../component/LastWillComponent'
import { EventKey } from '../../event/EventKeyEnum'
import { WorldLocationEvent } from '../../event/WorldEvents'
import { BeamUpComponent } from '../component/BeamUpComponent'
import { MAP_MARKER_CHANGE, MAP_MARKER_TYPE, MapMarkerComponent } from '../component/MapMarkerComponent'
import { UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { TooltipComponent } from '../component/TooltipComponent'
import { TooltipSpriteBuilder } from '../../resource/TooltipSpriteBuilder'
import { GameEntity } from '../ECS'

export class MaterialSpawner {
    static spawnMaterial(
        worldMgr: WorldManager,
        entityType: MaterialEntityType,
        worldPos: Vector2,
        headingRad?: number,
        targetSurface?: Surface,
        barrierLocation?: Vector2,
        targetSite?: BuildingSite,
    ): MaterialEntity {
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const material = new MaterialEntity(worldMgr, entityType, targetSurface, targetSite, barrierLocation)
        worldMgr.ecs.addComponent(material.entity, new PositionComponent(floorPosition, surface))
        switch (entityType) {
            case EntityType.ORE:
                const oreMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.ore)
                if (!oreMesh) throw new Error(`Cannot spawn ore missing mesh "${GameConfig.instance.miscObjects.ore}"`)
                material.sceneEntity.add(oreMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.ore))
                // Do not set priority identifier before workplace
                this.addTooltip(worldMgr, material.entity, material.entityType, () => 0)
                break
            case EntityType.BRICK:
                const brickMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.processedOre)
                if (!brickMesh) throw new Error(`Cannot spawn brick missing mesh "${GameConfig.instance.miscObjects.processedOre}"`)
                material.sceneEntity.add(brickMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.processedOre))
                // Do not set priority identifier before workplace
                this.addTooltip(worldMgr, material.entity, material.entityType, () => 0)
                break
            case EntityType.CRYSTAL:
                const energyCrystalMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.crystal)
                if (!energyCrystalMesh) throw new Error(`Cannot spawn energy crystal missing mesh "${GameConfig.instance.miscObjects.crystal}"`)
                energyCrystalMesh.material.forEach((m) => {
                    m.color.fromArray(GameConfig.instance.main.powerCrystalRGB)
                    m.emissive.fromArray(GameConfig.instance.main.powerCrystalRGB)
                })
                material.sceneEntity.add(energyCrystalMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.powerCrystal))
                // Do not set priority identifier before workplace
                this.addTooltip(worldMgr, material.entity, material.entityType, () => 0)
                break
            case EntityType.DEPLETED_CRYSTAL:
                const depletedCrystalMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.crystal)
                if (!depletedCrystalMesh) throw new Error(`Cannot spawn energy crystal missing mesh "${GameConfig.instance.miscObjects.crystal}"`)
                depletedCrystalMesh.material.forEach((m) => {
                    m.color.fromArray(GameConfig.instance.main.unpoweredCrystalRGB)
                    m.emissive.fromArray(GameConfig.instance.main.unpoweredCrystalRGB)
                })
                material.sceneEntity.add(depletedCrystalMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.powerCrystal))
                material.priorityIdentifier = PRIORITY_IDENTIFIER.recharge
                this.addTooltip(worldMgr, material.entity, EntityType.CRYSTAL, () => 0)
                break
            case EntityType.BARRIER:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(GameConfig.instance.miscObjects.barrier))
                material.sceneEntity.setAnimation(BARRIER_ACTIVITY.short)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {pickSphere: 10, collRadius: 10, collHeight: 0})) // XXX find any constant for pick sphere?
                material.priorityIdentifier = PRIORITY_IDENTIFIER.construction
                break
            case EntityType.DYNAMITE:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(GameConfig.instance.miscObjects.dynamite))
                material.sceneEntity.setAnimation(DYNAMITE_ACTIVITY.normal)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {pickSphere: 8, collRadius: 8, collHeight: 0})) // XXX find any constant for pick sphere?
                material.priorityIdentifier = PRIORITY_IDENTIFIER.destruction
                material.requiredTraining = RAIDER_TRAINING.demolition
                break
            case EntityType.ELECTRIC_FENCE:
                const electricFenceMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.electricFence)
                if (!electricFenceMesh) throw new Error(`Cannot spawn electric fence missing mesh "${GameConfig.instance.miscObjects.electricFence}"`)
                material.sceneEntity.add(electricFenceMesh)
                const statsFence = GameConfig.instance.stats.electricFence
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, statsFence))
                material.priorityIdentifier = PRIORITY_IDENTIFIER.construction
                const healthComponent = material.worldMgr.ecs.addComponent(material.entity, new HealthComponent(statsFence.damageCausesCallToArms, statsFence.collHeight, 10, material.sceneEntity, false, GameConfig.instance.getRockFallDamage(material.entityType, 0)))
                material.worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
                material.worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
                material.worldMgr.ecs.addComponent(material.entity, new LastWillComponent(() => {
                    EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_DEATH, material.worldMgr.ecs.getComponents(material.entity).get(PositionComponent)))
                    material.worldMgr.entityMgr.removeEntity(material.entity)
                    if (material.targetSurface) {
                        material.targetSurface.fence = undefined
                        material.targetSurface.fenceRequested = false
                    }
                    material.worldMgr.ecs.addComponent(material.entity, new BeamUpComponent(material))
                }))
                this.addTooltip(worldMgr, material.entity, material.entityType, () => healthComponent.health)
                break
        }
        material.sceneEntity.addToScene(worldMgr.sceneMgr, worldPos, headingRad)
        worldMgr.entityMgr.addEntity(material.entity, material.entityType)
        if (material.sceneEntity.visible) {
            material.setupCarryJob()
            worldMgr.entityMgr.materials.add(material) // TODO use game entities within entity manager
            worldMgr.ecs.addComponent(material.entity, new MapMarkerComponent(MAP_MARKER_TYPE.material))
            EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.material, material.entity, MAP_MARKER_CHANGE.update, floorPosition))
        } else {
            worldMgr.entityMgr.materialsUndiscovered.add(material) // TODO use game entities within entity manager
        }
        return material
    }

    static addTooltip(worldMgr: WorldManager, entity: GameEntity, entityType: EntityType, energyCallback: () => number) {
        const objectKey = entityType.toLowerCase()
        const objectName = GameConfig.instance.objectNames[objectKey] || ''
        const sfxKey = GameConfig.instance.objTtSFXs[objectKey] || ''
        if (objectName) worldMgr.ecs.addComponent(entity, new TooltipComponent(entity, objectName, sfxKey, () => {
            return TooltipSpriteBuilder.getTooltipSprite(objectName, energyCallback())
        }))
    }
}
