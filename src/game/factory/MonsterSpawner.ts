import { TILESIZE } from '../../params'
import { EntityType, MonsterEntityType } from '../model/EntityType'
import { WorldManager } from '../WorldManager'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { FlockComponent, FlockEntity } from '../component/FlockComponent'
import { HealthComponent } from '../component/HealthComponent'
import { MAP_MARKER_CHANGE, MAP_MARKER_TYPE } from '../component/MapMarkerComponent'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { Vector2 } from 'three'
import { ResourceManager } from '../../resource/ResourceManager'
import { MovableStatsComponent } from '../component/MovableStatsComponent'
import { ANIM_ENTITY_ACTIVITY, ROCK_MONSTER_ACTIVITY } from '../model/anim/AnimationActivity'
import { GameEntity } from '../ECS'
import { RandomMoveComponent } from '../component/RandomMoveComponent'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { LastWillComponent } from '../component/LastWillComponent'
import { RockMonsterBehaviorComponent } from '../component/RockMonsterBehaviorComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { MaterialSpawner } from './MaterialSpawner'
import { WorldLocationEvent } from '../../event/WorldEvents'
import { EventKey } from '../../event/EventKeyEnum'
import { RAIDER_SCARE_RANGE, RaiderScareComponent } from '../component/RaiderScareComponent'
import { SLUG_BEHAVIOR_STATE, SlugBehaviorComponent } from '../component/SlugBehaviorComponent'
import { UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { EntityPushedComponent } from '../component/EntityPushedComponent'
import { HeadingComponent } from '../component/HeadingComponent'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { TooltipComponent } from '../component/TooltipComponent'
import { SceneSelectionComponent } from '../component/SceneSelectionComponent'
import { MonsterEntityStats } from '../../cfg/GameStatsCfg'

export class MonsterSpawner {
    static spawnMonster(worldMgr: WorldManager, entityType: MonsterEntityType, worldPos: Vector2, headingRad: number): GameEntity {
        const entity = worldMgr.ecs.addEntity()
        const floorPosition = worldMgr.sceneMgr.getFloorPosition(worldPos)
        const surface = worldMgr.sceneMgr.terrain.getSurfaceFromWorld2D(worldPos)
        const positionComponent = worldMgr.ecs.addComponent(entity, new PositionComponent(floorPosition, surface))
        const sceneEntity: AnimatedSceneEntity = new AnimatedSceneEntity()
        sceneEntity.position.copy(floorPosition)
        sceneEntity.position.y += positionComponent.floorOffset
        sceneEntity.rotation.y = headingRad
        sceneEntity.visible = surface.discovered
        worldMgr.ecs.addComponent(entity, new AnimatedSceneEntityComponent(sceneEntity))
        switch (entityType) {
            case EntityType.SMALL_SPIDER:
                positionComponent.floorOffset = TILESIZE / 40
                sceneEntity.addAnimated(ResourceManager.getAnimatedData('Creatures/SpiderSB'))
                sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.stand)
                const spiderStats = GameConfig.instance.stats.smallSpider
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(spiderStats))
                if (spiderStats.randomMove) worldMgr.ecs.addComponent(entity, new RandomMoveComponent(Math.max(0, 10 - spiderStats.randomMoveTime) * 1000))
                break
            case EntityType.BAT:
                positionComponent.floorOffset = TILESIZE / 4
                const batStats = GameConfig.instance.stats.bat
                const flockEntities: FlockEntity[] = []
                for (let c = 0; c < batStats.flocksSize; c++) {
                    const flockSceneEntity: AnimatedSceneEntity = new AnimatedSceneEntity()
                    flockSceneEntity.position.copy(sceneEntity.position)
                    flockSceneEntity.rotation.copy(sceneEntity.rotation)
                    flockSceneEntity.visible = sceneEntity.visible
                    flockSceneEntity.addAnimated(ResourceManager.getAnimatedData('Creatures/bat'))
                    flockSceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.route)
                    // Change the speed slightly to make the animation unsynchronized
                    const speedModifier = 0.9 + 0.2 * (c + 0.5) / batStats.flocksSize
                    flockSceneEntity.setAnimationSpeed(speedModifier)
                    flockEntities.push({sceneEntity: flockSceneEntity, speed: batStats.flocksSpeed * speedModifier})
                    worldMgr.sceneMgr.addSceneEntity(flockSceneEntity)
                }
                worldMgr.ecs.addComponent(entity, new FlockComponent(flockEntities, {
                    separationDist: 10, separationMult: 1, cohesionDist: 10, cohesionMult: 1, alignmentMult: 0.2, inertiaMult: 2.5, speed: batStats.flocksSpeed,
                }))
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(batStats))
                if (batStats.randomMove) worldMgr.ecs.addComponent(entity, new RandomMoveComponent(Math.max(0, 10 - batStats.randomMoveTime) * 1000))
                worldMgr.ecs.addComponent(entity, new RaiderScareComponent(RAIDER_SCARE_RANGE.bat))
                worldMgr.ecs.addComponent(entity, new LastWillComponent(() => {
                    worldMgr.ecs.removeComponent(entity, RaiderScareComponent)
                    EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.monster, entity, MAP_MARKER_CHANGE.remove))
                }))
                break
            case EntityType.SLUG:
                sceneEntity.addAnimated(ResourceManager.getAnimatedData('Creatures/Slug'))
                worldMgr.ecs.addComponent(entity, new MovableStatsComponent(GameConfig.instance.stats.slug))
                worldMgr.ecs.addComponent(entity, new MonsterStatsComponent(GameConfig.instance.stats.slug))
                const healthComponent = worldMgr.ecs.addComponent(entity, new HealthComponent(false, 24, 10, sceneEntity, false, GameConfig.instance.getRockFallDamage(entityType, 0)))
                worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
                worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
                worldMgr.ecs.addComponent(entity, new LastWillComponent(() => {
                    worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                    worldMgr.ecs.removeComponent(entity, HeadingComponent)
                    worldMgr.ecs.removeComponent(entity, EntityPushedComponent)
                    worldMgr.ecs.getComponents(entity).get(SlugBehaviorComponent).state = SLUG_BEHAVIOR_STATE.goEnter
                    sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.stand)
                    EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.monster, entity, MAP_MARKER_CHANGE.remove))
                }))
                const objectKey = entityType.toLowerCase()
                const objectName = GameConfig.instance.objectNames[objectKey] || ''
                if (objectName) {
                    const sfxKey = GameConfig.instance.objTtSFXs[objectKey] || ''
                    worldMgr.ecs.addComponent(entity, new TooltipComponent(entity, objectName, sfxKey))
                }
                break
            case EntityType.ICE_MONSTER:
                this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/IceMonster', entityType, GameConfig.instance.stats.iceMonster)
                break
            case EntityType.LAVA_MONSTER:
                this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/LavaMonster', entityType, GameConfig.instance.stats.lavaMonster)
                break
            case EntityType.ROCK_MONSTER:
                this.addRockMonsterComponents(sceneEntity, worldMgr, entity, 'Creatures/RMonster', entityType, GameConfig.instance.stats.rockMonster)
                break
            default:
                throw new Error(`Unexpected entity type: ${entityType}`)
        }
        worldMgr.sceneMgr.addSceneEntity(sceneEntity)
        worldMgr.entityMgr.addEntity(entity, entityType)
        return entity
    }

    private static addRockMonsterComponents(sceneEntity: AnimatedSceneEntity, worldMgr: WorldManager, entity: number, aeName: string, entityType: EntityType, stats: MonsterEntityStats) {
        sceneEntity.addAnimated(ResourceManager.getAnimatedData(aeName))
        sceneEntity.setAnimation(ROCK_MONSTER_ACTIVITY.unpowered)
        const healthComponent = worldMgr.ecs.addComponent(entity, new HealthComponent(false, 24, 10, sceneEntity, false, GameConfig.instance.getRockFallDamage(entityType, 0)))
        worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
        worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
        worldMgr.ecs.addComponent(entity, new LastWillComponent(() => {
            const components = worldMgr.ecs.getComponents(entity)
            const numCrystalsEaten = components.getOptional(RockMonsterBehaviorComponent)?.numCrystalsEaten || 0
            worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
            worldMgr.ecs.removeComponent(entity, HeadingComponent)
            worldMgr.ecs.removeComponent(entity, EntityPushedComponent)
            worldMgr.ecs.removeComponent(entity, RockMonsterBehaviorComponent)
            sceneEntity.removeAllCarried()
            sceneEntity.setAnimation(ROCK_MONSTER_ACTIVITY.crumble, () => {
                const positionComponent = components.get(PositionComponent)
                for (let c = 0; c < numCrystalsEaten; c++) {
                    MaterialSpawner.spawnMaterial(worldMgr, EntityType.CRYSTAL, positionComponent.getPosition2D()) // XXX add random offset and random heading
                }
                EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_MONSTER_GONE, positionComponent))
                worldMgr.ecs.removeComponent(entity, RaiderScareComponent)
                EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.monster, entity, MAP_MARKER_CHANGE.remove))
                worldMgr.sceneMgr.disposeSceneEntity(sceneEntity)
                worldMgr.entityMgr.removeEntity(entity)
                worldMgr.ecs.removeEntity(entity)
            })
        }))
        worldMgr.ecs.addComponent(entity, new MovableStatsComponent(stats))
        worldMgr.ecs.addComponent(entity, new MonsterStatsComponent(stats))
        worldMgr.ecs.addComponent(entity, new SceneSelectionComponent(sceneEntity, {gameEntity: entity, entityType: entityType}, stats))
        const objectName = GameConfig.instance.objectNames[entityType.toLowerCase()]
        if (objectName) worldMgr.ecs.addComponent(entity, new TooltipComponent(entity, objectName, GameConfig.instance.objTtSFXs[entityType.toLowerCase()] || ''))
    }
}
