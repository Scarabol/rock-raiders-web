import { WorldManager } from '../WorldManager'
import { AdditiveBlending, Color, Vector2 } from 'three'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { Surface } from '../terrain/Surface'
import { EntityType, MaterialEntityType } from '../model/EntityType'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneSelectionComponent } from '../component/SceneSelectionComponent'
import { SequenceTextureMaterial } from '../../scene/SequenceTextureMaterial'
import { BuildingSite } from '../model/building/BuildingSite'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { BarrierActivity, DynamiteActivity } from '../model/anim/AnimationActivity'
import { PriorityIdentifier } from '../model/job/PriorityIdentifier'
import { RaiderTraining } from '../model/raider/RaiderTraining'
import { HealthComponent } from '../component/HealthComponent'
import { LastWillComponent } from '../component/LastWillComponent'
import { EventBus } from '../../event/EventBus'
import { GenericDeathEvent } from '../../event/WorldLocationEvent'
import { BeamUpComponent } from '../component/BeamUpComponent'

export class MaterialSpawner {
    static spawnMaterial(
        worldMgr: WorldManager,
        entityType: MaterialEntityType,
        worldPos: Vector2,
        headingRad: number = null,
        targetSurface: Surface = null,
        barrierLocation: Vector2 = null,
        targetSite: BuildingSite = null,
    ) {
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const material = new MaterialEntity(worldMgr, entityType, targetSurface, targetSite, barrierLocation)
        worldMgr.ecs.addComponent(material.entity, new PositionComponent(floorPosition, surface))
        material.sceneEntity = new AnimatedSceneEntity(worldMgr.sceneMgr.audioListener)
        switch (entityType) {
            case EntityType.ORE:
                material.sceneEntity.add(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Ore))
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, ResourceManager.configuration.stats.ore))
                material.priorityIdentifier = PriorityIdentifier.ORE
                break
            case EntityType.BRICK:
                material.sceneEntity.add(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.ProcessedOre))
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, ResourceManager.configuration.stats.processedOre))
                material.priorityIdentifier = PriorityIdentifier.ORE
                break
            case EntityType.CRYSTAL:
                const animGlowMesh = ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Crystal)
                animGlowMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
                    mat.blending = AdditiveBlending
                    mat.depthWrite = false // otherwise, transparent parts "carve out" objects behind
                    mat.setOpacity(0.5) // XXX read from LWO file?
                })
                animGlowMesh.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
                material.sceneEntity.add(animGlowMesh) // TODO this mesh needs to be updated
                const highPolyMesh = ResourceManager.getLwoModel('World/Shared/Crystal') // high poly version
                highPolyMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
                    mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
                    mat.color = new Color(0, 0, 0) // XXX read from LWO file?
                    mat.setOpacity(0.9) // XXX read from LWO file?
                })
                material.sceneEntity.add(highPolyMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, ResourceManager.configuration.stats.powerCrystal))
                material.priorityIdentifier = PriorityIdentifier.CRYSTAL
                break
            case EntityType.BARRIER:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(ResourceManager.configuration.miscObjects.Barrier))
                material.sceneEntity.setAnimation(BarrierActivity.Short)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {PickSphere: 10, CollRadius: 10, CollHeight: 0})) // XXX find any constant for pick sphere?
                material.priorityIdentifier = PriorityIdentifier.CONSTRUCTION
                break
            case EntityType.DYNAMITE:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(ResourceManager.configuration.miscObjects.Dynamite))
                material.sceneEntity.setAnimation(DynamiteActivity.Normal)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {PickSphere: 8, CollRadius: 8, CollHeight: 0})) // XXX find any constant for pick sphere?
                material.priorityIdentifier = PriorityIdentifier.DESTRUCTION
                material.requiredTraining = RaiderTraining.DEMOLITION
                break
            case EntityType.ELECTRIC_FENCE:
                const statsFence = ResourceManager.configuration.stats.electricFence
                material.sceneEntity.add(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.ElectricFence))
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, statsFence))
                material.priorityIdentifier = PriorityIdentifier.CONSTRUCTION
                material.worldMgr.ecs.addComponent(material.entity, new HealthComponent(statsFence.DamageCausesCallToArms, statsFence.CollHeight, 10, material.sceneEntity, false))
                material.worldMgr.ecs.addComponent(material.entity, new LastWillComponent(() => {
                    EventBus.publishEvent(new GenericDeathEvent(material.worldMgr.ecs.getComponents(material.entity).get(PositionComponent)))
                    material.worldMgr.entityMgr.removeEntity(material.entity)
                    material.targetSurface.fence = null
                    material.targetSurface.fenceRequested = false
                    material.worldMgr.ecs.addComponent(material.entity, new BeamUpComponent(material))
                }))
                break
        }
        material.sceneEntity.addToScene(worldMgr.sceneMgr, worldPos, headingRad)
        worldMgr.entityMgr.addEntity(material.entity, material.entityType)
        if (material.sceneEntity.visible) {
            material.setupCarryJob()
            worldMgr.entityMgr.materials.add(material) // TODO use game entities within entity manager
        } else {
            worldMgr.entityMgr.materialsUndiscovered.add(material) // TODO use game entities within entity manager
        }
        return material
    }
}
