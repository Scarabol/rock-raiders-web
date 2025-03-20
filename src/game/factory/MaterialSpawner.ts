import { WorldManager } from '../WorldManager'
import { Vector2 } from 'three'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { Surface } from '../terrain/Surface'
import { EntityType, MaterialEntityType } from '../model/EntityType'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneSelectionComponent } from '../component/SceneSelectionComponent'
import { BuildingSite } from '../model/building/BuildingSite'
import { PositionComponent } from '../component/PositionComponent'
import { BarrierActivity, DynamiteActivity } from '../model/anim/AnimationActivity'
import { PriorityIdentifier } from '../model/job/PriorityIdentifier'
import { RaiderTraining } from '../model/raider/RaiderTraining'
import { HealthComponent } from '../component/HealthComponent'
import { LastWillComponent } from '../component/LastWillComponent'
import { GenericDeathEvent } from '../../event/WorldLocationEvent'
import { BeamUpComponent } from '../component/BeamUpComponent'
import { MapMarkerChange, MapMarkerComponent, MapMarkerType } from '../component/MapMarkerComponent'
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
    ) {
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const material = new MaterialEntity(worldMgr, entityType, targetSurface, targetSite, barrierLocation)
        worldMgr.ecs.addComponent(material.entity, new PositionComponent(floorPosition, surface))
        switch (entityType) {
            case EntityType.ORE:
                const oreMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.Ore)
                if (!oreMesh) throw new Error(`Cannot spawn ore missing mesh "${GameConfig.instance.miscObjects.Ore}"`)
                material.sceneEntity.add(oreMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.ore))
                material.priorityIdentifier = PriorityIdentifier.ORE
                this.addTooltip(worldMgr, material.entity, material.entityType, () => 0)
                break
            case EntityType.BRICK:
                const brickMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.ProcessedOre)
                if (!brickMesh) throw new Error(`Cannot spawn brick missing mesh "${GameConfig.instance.miscObjects.ProcessedOre}"`)
                material.sceneEntity.add(brickMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.processedOre))
                material.priorityIdentifier = PriorityIdentifier.ORE
                this.addTooltip(worldMgr, material.entity, material.entityType, () => 0)
                break
            case EntityType.CRYSTAL:
                const energyCrystalMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.Crystal)
                if (!energyCrystalMesh) throw new Error(`Cannot spawn energy crystal missing mesh "${GameConfig.instance.miscObjects.Crystal}"`)
                energyCrystalMesh.material.forEach((m) => {
                    m.color.fromArray(GameConfig.instance.main.powerCrystalRGB)
                    m.emissive.fromArray(GameConfig.instance.main.powerCrystalRGB)
                })
                material.sceneEntity.add(energyCrystalMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.powerCrystal))
                material.priorityIdentifier = PriorityIdentifier.CRYSTAL
                this.addTooltip(worldMgr, material.entity, material.entityType, () => 0)
                break
            case EntityType.DEPLETED_CRYSTAL:
                const depletedCrystalMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.Crystal)
                if (!depletedCrystalMesh) throw new Error(`Cannot spawn energy crystal missing mesh "${GameConfig.instance.miscObjects.Crystal}"`)
                depletedCrystalMesh.material.forEach((m) => {
                    m.color.fromArray(GameConfig.instance.main.unpoweredCrystalRGB)
                    m.emissive.fromArray(GameConfig.instance.main.unpoweredCrystalRGB)
                })
                material.sceneEntity.add(depletedCrystalMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, GameConfig.instance.stats.powerCrystal))
                material.priorityIdentifier = PriorityIdentifier.RECHARGE
                this.addTooltip(worldMgr, material.entity, EntityType.CRYSTAL, () => 0)
                break
            case EntityType.BARRIER:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(GameConfig.instance.miscObjects.Barrier))
                material.sceneEntity.setAnimation(BarrierActivity.Short)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {PickSphere: 10, CollRadius: 10, CollHeight: 0})) // XXX find any constant for pick sphere?
                material.priorityIdentifier = PriorityIdentifier.CONSTRUCTION
                break
            case EntityType.DYNAMITE:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(GameConfig.instance.miscObjects.Dynamite))
                material.sceneEntity.setAnimation(DynamiteActivity.Normal)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {PickSphere: 8, CollRadius: 8, CollHeight: 0})) // XXX find any constant for pick sphere?
                material.priorityIdentifier = PriorityIdentifier.DESTRUCTION
                material.requiredTraining = RaiderTraining.DEMOLITION
                break
            case EntityType.ELECTRIC_FENCE:
                const electricFenceMesh = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.ElectricFence)
                if (!electricFenceMesh) throw new Error(`Cannot spawn electric fence missing mesh "${GameConfig.instance.miscObjects.ElectricFence}"`)
                material.sceneEntity.add(electricFenceMesh)
                const statsFence = GameConfig.instance.stats.electricFence
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, statsFence))
                material.priorityIdentifier = PriorityIdentifier.CONSTRUCTION
                const healthComponent = material.worldMgr.ecs.addComponent(material.entity, new HealthComponent(statsFence.DamageCausesCallToArms, statsFence.CollHeight, 10, material.sceneEntity, false, GameConfig.instance.getRockFallDamage(material.entityType, 0)))
                material.worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
                material.worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
                material.worldMgr.ecs.addComponent(material.entity, new LastWillComponent(() => {
                    EventBroker.publish(new GenericDeathEvent(material.worldMgr.ecs.getComponents(material.entity).get(PositionComponent)))
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
            worldMgr.ecs.addComponent(material.entity, new MapMarkerComponent(MapMarkerType.MATERIAL))
            EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.MATERIAL, material.entity, MapMarkerChange.UPDATE, floorPosition))
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
