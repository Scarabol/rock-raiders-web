import { TILESIZE } from '../../params'
import { EntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { PositionComponent } from '../component/PositionComponent'
import { SceneEntityComponent } from '../component/SceneEntityComponent'
import { HealthComponent } from '../component/HealthComponent'
import { EntityMapMarkerComponent, MapMarkerType } from '../component/EntityMapMarkerComponent'
import { HealthBarComponent } from '../component/HealthBarComponent'
import { AnimatedMeshGroup } from '../../scene/AnimatedMeshGroup'
import { Vector2 } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { AnimEntityActivity, RockMonsterActivity } from '../model/anim/AnimationActivity'

type MonsterEntityType = EntityType.SMALL_SPIDER | EntityType.BAT | EntityType.ICE_MONSTER | EntityType.LAVA_MONSTER | EntityType.ROCK_MONSTER

export class MonsterSpawner {
    static spawnMonster(worldMgr: WorldManager, entityType: MonsterEntityType, worldPos: Vector2, headingRad: number): void {
        const entity = worldMgr.ecs.addEntity()
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const positionComponent = worldMgr.ecs.addComponent(entity, new PositionComponent(floorPosition, surface))
        const sceneEntity: AnimatedMeshGroup = new AnimatedMeshGroup()
        worldMgr.ecs.addComponent(entity, new SceneEntityComponent(sceneEntity))
        switch (entityType) {
            case EntityType.SMALL_SPIDER:
                positionComponent.floorOffset = 1
                sceneEntity.addAnimated(ResourceManager.getAnimatedData('Creatures/SpiderSB'))
                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(ResourceManager.configuration.stats.smallSpider, 10000))
                worldMgr.ecs.addComponent(entity, new HealthComponent())
                break
            case EntityType.BAT: // TODO make bats appear in flocks
                positionComponent.floorOffset = TILESIZE / 2
                sceneEntity.addAnimated(ResourceManager.getAnimatedData('Creatures/bat'))
                sceneEntity.setAnimation(AnimEntityActivity.Route)
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(ResourceManager.configuration.stats.bat, 0))
                worldMgr.ecs.addComponent(entity, new EntityMapMarkerComponent(MapMarkerType.MONSTER))
                break
            case EntityType.ICE_MONSTER:
                this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/IceMonster')
                break
            case EntityType.LAVA_MONSTER:
                this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/LavaMonster')
                break
            case EntityType.ROCK_MONSTER:
                this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/RMonster')
                break
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
        sceneEntity.position.copy(worldMgr.sceneMgr.getFloorPosition(worldPos))
        sceneEntity.position.y += positionComponent.floorOffset
        sceneEntity.rotation.y = headingRad
        sceneEntity.visible = surface.discovered
        worldMgr.sceneMgr.addMeshGroup(sceneEntity)
        worldMgr.entityMgr.addEntity(entity, entityType)
    }

    private static addRockMonsterComponents(sceneEntity: AnimatedMeshGroup, worldMgr: WorldManager, entity: number, aeName: string) {
        sceneEntity.addAnimated(ResourceManager.getAnimatedData(aeName))
        sceneEntity.setAnimation(RockMonsterActivity.Unpowered)
        worldMgr.ecs.addComponent(entity, new EntityMapMarkerComponent(MapMarkerType.MONSTER))
        worldMgr.ecs.addComponent(entity, new HealthComponent())
        worldMgr.ecs.addComponent(entity, new HealthBarComponent(24, 10, null, false))
    }
}
