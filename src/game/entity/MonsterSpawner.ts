import { TILESIZE } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimatedSceneEntityComponent } from '../component/common/AnimatedSceneEntityComponent'
import { EntityMapMarkerComponent, MAP_MARKER_TYPE } from '../component/common/EntityMapMarkerComponent'
import { MovableEntityStatsComponent } from '../component/common/MovableEntityStatsComponent'
import { PositionComponent } from '../component/common/PositionComponent'
import { BatMovementComponent } from '../component/monster/BatMovementComponent'
import { SpiderMovementComponent } from '../component/monster/SpiderMovementComponent'
import { EntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { AbstractGameEntity } from './AbstractGameEntity'

type MonsterEntityType = EntityType.SMALL_SPIDER | EntityType.BAT | EntityType.ICE_MONSTER | EntityType.LAVA_MONSTER | EntityType.ROCK_MONSTER

export class MonsterSpawner {
    static createMonster(entityType: MonsterEntityType, worldMgr: WorldManager): AbstractGameEntity {
        const entity = new AbstractGameEntity(entityType)
        this.addMonsterComponents(entityType, entity, worldMgr)
        worldMgr.registerEntity(entity)
        return entity
    }

    private static addMonsterComponents(entityType: MonsterEntityType, entity: AbstractGameEntity, worldMgr: WorldManager) {
        switch (entityType) {
            case EntityType.SMALL_SPIDER:
                entity.addComponent(new PositionComponent())
                entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, 'Creatures/SpiderSB/SpiderSB.ae', 1))
                entity.addComponent(new MovableEntityStatsComponent(ResourceManager.configuration.stats.SmallSpider))
                entity.addComponent(new SpiderMovementComponent())
                break
            case EntityType.BAT:
                entity.addComponent(new PositionComponent())
                entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, 'Creatures/bat/bat.ae', TILESIZE / 2))
                entity.addComponent(new MovableEntityStatsComponent(ResourceManager.configuration.stats.Bat))
                entity.addComponent(new BatMovementComponent())
                entity.addComponent(new EntityMapMarkerComponent(MAP_MARKER_TYPE.MONSTER))
                break
            case EntityType.ICE_MONSTER:
                entity.addComponent(new PositionComponent())
                entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, 'Creatures/IceMonster/IceMonster.ae'))
                entity.addComponent(new EntityMapMarkerComponent(MAP_MARKER_TYPE.MONSTER))
                break
            case EntityType.LAVA_MONSTER:
                entity.addComponent(new PositionComponent())
                entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, 'Creatures/LavaMonster/LavaMonster.ae'))
                entity.addComponent(new EntityMapMarkerComponent(MAP_MARKER_TYPE.MONSTER))
                break
            case EntityType.ROCK_MONSTER:
                entity.addComponent(new PositionComponent())
                entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, 'Creatures/RMonster/RMonster.ae'))
                entity.addComponent(new EntityMapMarkerComponent(MAP_MARKER_TYPE.MONSTER))
                break
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
    }
}
