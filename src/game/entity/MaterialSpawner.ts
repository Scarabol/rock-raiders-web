import { WorldManager } from '../WorldManager'
import { AdditiveBlending, Color, Vector2 } from 'three'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { Surface } from '../terrain/Surface'
import { EntityType } from '../model/EntityType'
import { ResourceManager } from '../../resource/ResourceManager'
import { SceneSelectionComponent } from '../component/SceneSelectionComponent'
import { SequenceTextureMaterial } from '../../scene/SequenceTextureMaterial'
import { BuildingSite } from '../model/building/BuildingSite'
import { BarrierLocation } from '../model/material/BarrierLocation'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { BarrierActivity, DynamiteActivity } from '../model/anim/AnimationActivity'

export type MaterialEntityType = EntityType.ORE | EntityType.CRYSTAL | EntityType.BRICK | EntityType.BARRIER | EntityType.DYNAMITE | EntityType.ELECTRIC_FENCE

export class MaterialSpawner {
    static spawnMaterial(
        worldMgr: WorldManager,
        entityType: MaterialEntityType,
        worldPos: Vector2,
        headingRad: number = null,
        targetSurface: Surface = null,
        barrierLocation: BarrierLocation = null,
        targetSite: BuildingSite = null,
    ) {
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const material = new MaterialEntity(worldMgr, entityType, targetSurface, targetSite, barrierLocation)
        worldMgr.ecs.addComponent(material.entity, new PositionComponent(floorPosition, surface))
        material.sceneEntity = new AnimatedSceneEntity()
        switch (entityType) {
            case EntityType.ORE:
                material.sceneEntity.add(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Ore))
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, ResourceManager.configuration.stats.ore))
                break
            case EntityType.CRYSTAL:
                const animGlowMesh = ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Crystal)
                animGlowMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
                    mat.blending = AdditiveBlending
                    mat.depthWrite = false // otherwise, transparent parts "carve out" objects behind
                    mat.setOpacity(0.5) // XXX read from LWO file?
                })
                animGlowMesh.scale.set(1.75, 1.75, 1.75) // XXX derive from texture scale?
                material.sceneEntity.add(animGlowMesh) // FIXME this mesh needs to be updated
                const highPolyMesh = ResourceManager.getLwoModel('World/Shared/Crystal') // high poly version
                highPolyMesh.getMaterials().forEach((mat: SequenceTextureMaterial) => {
                    mat.emissive = new Color(0, 8, 0) // XXX read from LWO file?
                    mat.color = new Color(0, 0, 0) // XXX read from LWO file?
                    mat.setOpacity(0.9) // XXX read from LWO file?
                })
                material.sceneEntity.add(highPolyMesh)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, ResourceManager.configuration.stats.powerCrystal))
                break
            case EntityType.BRICK:
                material.sceneEntity.add(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.ProcessedOre))
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, ResourceManager.configuration.stats.processedOre))
                break
            case EntityType.BARRIER:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(ResourceManager.configuration.miscObjects.Barrier))
                material.sceneEntity.setAnimation(BarrierActivity.Short)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {PickSphere: 10})) // XXX find any constant for pick sphere?
                break
            case EntityType.DYNAMITE:
                material.sceneEntity.addAnimated(ResourceManager.getAnimatedData(ResourceManager.configuration.miscObjects.Dynamite))
                material.sceneEntity.setAnimation(DynamiteActivity.Normal)
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, {PickSphere: 8})) // XXX find any constant for pick sphere?
                break
            case EntityType.ELECTRIC_FENCE:
                material.sceneEntity.add(ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.ElectricFence))
                worldMgr.ecs.addComponent(material.entity, new SceneSelectionComponent(material.sceneEntity, {gameEntity: material.entity, entityType: material.entityType}, ResourceManager.configuration.stats.electricFence, ResourceManager.configuration.stats.electricFence.PickSphere / 3))
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
