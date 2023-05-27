import { TILESIZE } from '../../params'
import { EntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { PositionComponent } from '../component/PositionComponent'
import { SceneEntityComponent } from '../component/SceneEntityComponent'
import { HealthComponent } from '../component/HealthComponent'
import { EntityMapMarkerComponent, MapMarkerType } from '../component/EntityMapMarkerComponent'
import { HealthBarComponent } from '../component/HealthBarComponent'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { AnimEntityActivity, RockMonsterActivity } from '../model/anim/AnimationActivity'
import { Vector2 } from 'three'
import { RandomMoveComponent } from '../component/RandomMoveComponent'
import { ResourceManager } from '../../resource/ResourceManager'
import { MovableStatsComponent } from '../component/MovableStatsComponent'

type MonsterEntityType = EntityType.SMALL_SPIDER | EntityType.BAT | EntityType.ICE_MONSTER | EntityType.LAVA_MONSTER | EntityType.ROCK_MONSTER

export class MonsterSpawner {
    static spawnMonster(worldMgr: WorldManager, entityType: MonsterEntityType, worldPos: Vector2, radHeading: number): void {
        const entity = worldMgr.ecs.addEntity()
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const positionComponent = worldMgr.ecs.addComponent(entity, new PositionComponent(floorPosition, surface))
        let sceneEntity: AnimatedSceneEntity = null
        switch (entityType) {
            case EntityType.SMALL_SPIDER:
                positionComponent.floorOffset = 1
                sceneEntity = new AnimatedSceneEntity(worldMgr.sceneMgr, 'Creatures/SpiderSB', 1)
                sceneEntity.changeActivity(AnimEntityActivity.Stand)
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(ResourceManager.configuration.stats.smallSpider))
                worldMgr.ecs.addComponent(entity, new HealthComponent())
                worldMgr.ecs.addComponent(entity, new RandomMoveComponent(ResourceManager.configuration.stats.smallSpider, 10000))
                break
            case EntityType.BAT: // TODO make bats appear in flocks
                positionComponent.floorOffset = TILESIZE / 2
                sceneEntity = new AnimatedSceneEntity(worldMgr.sceneMgr, 'Creatures/bat', TILESIZE / 2)
                sceneEntity.changeActivity(AnimEntityActivity.Route)
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(ResourceManager.configuration.stats.bat))
                worldMgr.ecs.addComponent(entity, new EntityMapMarkerComponent(MapMarkerType.MONSTER))
                worldMgr.ecs.addComponent(entity, new RandomMoveComponent(ResourceManager.configuration.stats.bat, 0))
                break
            case EntityType.ICE_MONSTER:
                sceneEntity = this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/IceMonster')
                break
            case EntityType.LAVA_MONSTER:
                sceneEntity = this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/LavaMonster')
                break
            case EntityType.ROCK_MONSTER:
                sceneEntity = this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/RMonster')
                break
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
        sceneEntity.addToScene(worldPos, radHeading)
        worldMgr.ecs.addComponent(entity, new SceneEntityComponent(sceneEntity))
        worldMgr.entityMgr.addEntity(entity, entityType)
    }

    private static addRockMonsterComponents(sceneEntity: AnimatedSceneEntity, worldMgr: WorldManager, entity: number, aeName: string) {
        sceneEntity = new AnimatedSceneEntity(worldMgr.sceneMgr, aeName)
        sceneEntity.changeActivity(RockMonsterActivity.Unpowered)
        worldMgr.ecs.addComponent(entity, new EntityMapMarkerComponent(MapMarkerType.MONSTER))
        worldMgr.ecs.addComponent(entity, new HealthComponent())
        worldMgr.ecs.addComponent(entity, new HealthBarComponent(24, 10, null, false))
        return sceneEntity
    }
}
