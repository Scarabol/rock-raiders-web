import { TILESIZE } from '../../params'
import { ResourceManager } from '../../resource/ResourceManager'
import { AnimatedSceneEntityComponent } from '../component/common/AnimatedSceneEntityComponent'
import { EntityMapMarkerComponent, MAP_MARKER_TYPE } from '../component/common/EntityMapMarkerComponent'
import { HealthComponent } from '../component/common/HealthComponent'
import { MovableEntityStatsComponent } from '../component/common/MovableEntityStatsComponent'
import { PositionComponent } from '../component/common/PositionComponent'
import { BatMovementComponent } from '../component/monster/BatMovementComponent'
import { SpiderMovementComponent } from '../component/monster/SpiderMovementComponent'
import { EntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { AbstractGameEntity } from './AbstractGameEntity'
import { HealthBarSpriteComponent } from "../component/common/HealthBarSpriteComponent"

type MonsterEntityType = EntityType.SMALL_SPIDER | EntityType.BAT | EntityType.ICE_MONSTER | EntityType.LAVA_MONSTER | EntityType.ROCK_MONSTER

export class MonsterSpawner {
    static createMonster(entityType: MonsterEntityType, worldMgr: WorldManager): AbstractGameEntity {
        const entity = new AbstractGameEntity(entityType)
        this.addMonsterComponents(entityType, entity, worldMgr)
        worldMgr.registerEntity(entity)
        return entity
    }

    private static addMonsterComponents(entityType: MonsterEntityType, entity: AbstractGameEntity, worldMgr: WorldManager) {
        entity.addComponent(new PositionComponent())
        switch (entityType) {
            case EntityType.SMALL_SPIDER:
                entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, 'Creatures/SpiderSB/SpiderSB.ae', 1))
                entity.addComponent(new MovableEntityStatsComponent(ResourceManager.configuration.stats.smallSpider))
                entity.addComponent(new SpiderMovementComponent())
                entity.addComponent(new HealthComponent()).addOnDeathListener(() => entity.worldMgr.markDead(entity))
                break
            case EntityType.BAT:
                entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, 'Creatures/bat/bat.ae', TILESIZE / 2))
                entity.addComponent(new MovableEntityStatsComponent(ResourceManager.configuration.stats.bat))
                entity.addComponent(new BatMovementComponent())
                entity.addComponent(new EntityMapMarkerComponent(MAP_MARKER_TYPE.MONSTER))
                break
            case EntityType.ICE_MONSTER:
                this.addRockyComponents(entity, worldMgr, 'Creatures/IceMonster/IceMonster.ae')
                break
            case EntityType.LAVA_MONSTER:
                this.addRockyComponents(entity, worldMgr, 'Creatures/LavaMonster/LavaMonster.ae')
                break
            case EntityType.ROCK_MONSTER:
                this.addRockyComponents(entity, worldMgr, 'Creatures/RMonster/RMonster.ae')
                break
            default:
                throw new Error(`Unexpected entity type: ${EntityType[entityType]}`)
        }
    }

    private static addRockyComponents(entity: AbstractGameEntity, worldMgr: WorldManager, aeFilename: string) {
        entity.addComponent(new AnimatedSceneEntityComponent(worldMgr.sceneMgr, aeFilename))
        entity.addComponent(new EntityMapMarkerComponent(MAP_MARKER_TYPE.MONSTER))
        entity.addComponent(new HealthComponent())
        entity.addComponent(new HealthBarSpriteComponent(24, 10, null, false))
    }
}
