import { TILESIZE } from '../../params'
import { EntityType, MonsterEntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { HealthComponent } from '../component/HealthComponent'
import { MapMarkerComponent, MapMarkerType } from '../component/MapMarkerComponent'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { Vector2 } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { AnimEntityActivity, RockMonsterActivity } from '../model/anim/AnimationActivity'
import { GameEntity } from '../ECS'
import { RandomMoveComponent } from '../component/RandomMoveComponent'

export class MonsterSpawner {
    static spawnMonster(worldMgr: WorldManager, entityType: MonsterEntityType, worldPos: Vector2, headingRad: number): GameEntity {
        const entity = worldMgr.ecs.addEntity()
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const positionComponent = worldMgr.ecs.addComponent(entity, new PositionComponent(floorPosition, surface))
        const sceneEntity: AnimatedSceneEntity = new AnimatedSceneEntity(worldMgr.sceneMgr.audioListener)
        worldMgr.ecs.addComponent(entity, new AnimatedSceneEntityComponent(sceneEntity))
        switch (entityType) {
            case EntityType.SMALL_SPIDER:
                positionComponent.floorOffset = 1
                sceneEntity.addAnimated(ResourceManager.getAnimatedData('Creatures/SpiderSB'))
                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                const spiderStats = ResourceManager.configuration.stats.smallSpider
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(spiderStats))
                if (spiderStats.RandomMove) worldMgr.ecs.addComponent(entity, new RandomMoveComponent(Math.max(0, 10 - spiderStats.RandomMoveTime) * 1000))
                break
            case EntityType.BAT: // TODO make bats appear in flocks
                positionComponent.floorOffset = TILESIZE / 2
                sceneEntity.addAnimated(ResourceManager.getAnimatedData('Creatures/bat'))
                sceneEntity.setAnimation(AnimEntityActivity.Route)
                const batStats = ResourceManager.configuration.stats.bat
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(batStats))
                if (batStats.RandomMove) worldMgr.ecs.addComponent(entity, new RandomMoveComponent(Math.max(0, 10 - batStats.RandomMoveTime) * 1000))
                worldMgr.ecs.addComponent(entity, new MapMarkerComponent(MapMarkerType.MONSTER))
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
        return entity
    }

    private static addRockMonsterComponents(sceneEntity: AnimatedSceneEntity, worldMgr: WorldManager, entity: number, aeName: string) {
        sceneEntity.addAnimated(ResourceManager.getAnimatedData(aeName))
        sceneEntity.setAnimation(RockMonsterActivity.Unpowered)
        worldMgr.ecs.addComponent(entity, new MapMarkerComponent(MapMarkerType.MONSTER))
        worldMgr.ecs.addComponent(entity, new HealthComponent(false, 24, 10, sceneEntity, false))
    }
}
