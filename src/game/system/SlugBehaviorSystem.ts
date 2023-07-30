import { AbstractGameSystem, GameEntity } from '../ECS'
import { SlugBehaviorComponent, SlugBehaviorState } from '../component/SlugBehaviorComponent'
import { WorldManager } from '../WorldManager'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { PositionComponent } from '../component/PositionComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PathTarget } from '../model/PathTarget'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { AnimEntityActivity, SlugActivity } from '../model/anim/AnimationActivity'
import { EventBus } from '../../event/EventBus'
import { PowerDrainEvent, WorldLocationEvent } from '../../event/WorldLocationEvent'
import { EventKey } from '../../event/EventKeyEnum'
import { GameState } from '../model/GameState'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { SLUG_MAX_IDLE_TIME, SLUG_SUCK_TIME } from '../../params'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { MaterialSpawner } from '../entity/MaterialSpawner'
import { EntityType } from '../model/EntityType'

const SLUG_SUCK_DISTANCE_SQ = 25 * 25
const SLUG_ENTER_DISTANCE_SQ = 5 * 5

export class SlugBehaviorSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([SlugBehaviorComponent, MonsterStatsComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        const pathFinder = this.worldMgr.sceneMgr.terrain.pathFinder
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const behaviorComponent = components.get(SlugBehaviorComponent)
                const positionComponent = components.get(PositionComponent)
                const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
                const stats = components.get(MonsterStatsComponent).stats
                const slugPos = positionComponent.getPosition2D()
                switch (behaviorComponent.state) {
                    case SlugBehaviorState.IDLE:
                        if (behaviorComponent.targetBuilding) {
                            behaviorComponent.state = SlugBehaviorState.LEECH
                        } else if (behaviorComponent.energyLeeched) {
                            behaviorComponent.state = SlugBehaviorState.GO_ENTER
                        } else if (behaviorComponent.idleTimer > SLUG_MAX_IDLE_TIME) {
                            behaviorComponent.state = SlugBehaviorState.GO_ENTER
                        } else {
                            behaviorComponent.idleTimer += elapsedMs
                            const energizedBuildings = this.worldMgr.entityMgr.buildings.filter((b) => b.energized)
                            const closestBuilding = pathFinder.findClosestBuilding(slugPos, energizedBuildings, stats, false)
                            if (closestBuilding) {
                                behaviorComponent.state = SlugBehaviorState.LEECH
                                behaviorComponent.targetBuilding = closestBuilding.obj
                            } else if (!components.has(WorldTargetComponent)) {
                                const randomTarget = [positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())].random().getRandomPosition()
                                this.ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                            }
                        }
                        break
                    case SlugBehaviorState.LEECH:
                        if (!behaviorComponent.targetBuilding?.energized) {
                            this.changeToIdle(entity, sceneEntity, behaviorComponent)
                        } else {
                            const targetSurface = behaviorComponent.targetBuilding.buildingSurfaces.find((s) => s.getCenterWorld2D().distanceToSquared(slugPos) <= SLUG_SUCK_DISTANCE_SQ)
                            if (targetSurface) {
                                if (components.has(WorldTargetComponent)) {
                                    sceneEntity.headTowards(targetSurface.getCenterWorld2D())
                                    this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                                    EventBus.publishEvent(new PowerDrainEvent(new PositionComponent(positionComponent.position, positionComponent.surface)))
                                }
                                sceneEntity.setAnimation(SlugActivity.Suck, () => {
                                    GameState.numCrystal--
                                    EventBus.publishEvent(new MaterialAmountChanged())
                                    MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.DEPLETED_CRYSTAL, positionComponent.getPosition2D())
                                    behaviorComponent.state = SlugBehaviorState.GO_ENTER
                                    behaviorComponent.energyLeeched = true
                                }, SLUG_SUCK_TIME)
                            } else if (!components.has(WorldTargetComponent)) {
                                const buildingPathTargets = behaviorComponent.targetBuilding.getTrainingTargets()
                                const path = pathFinder.findShortestPath(slugPos, buildingPathTargets, stats, false)
                                if (path && path.locations.length > 0) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0]))
                                } else {
                                    console.warn('Slug cannot find path to targets', buildingPathTargets)
                                    this.changeToIdle(entity, sceneEntity, behaviorComponent)
                                }
                            }
                        }
                        break
                    case SlugBehaviorState.GO_ENTER:
                        if (!behaviorComponent.targetEnter) {
                            const enterTargets = this.worldMgr.sceneMgr.terrain.slugHoles.map((h) => PathTarget.fromLocation(h.getRandomPosition(), SLUG_ENTER_DISTANCE_SQ))
                            const path = pathFinder.findShortestPath(positionComponent.getPosition2D(), enterTargets, stats, false)
                            if (path && path.locations.length > 0) {
                                behaviorComponent.targetEnter = path.target
                            } else {
                                const randomTarget = [positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())].random().getRandomPosition()
                                this.ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                            }
                        } else if (behaviorComponent.targetEnter.targetLocation.distanceToSquared(slugPos) <= SLUG_ENTER_DISTANCE_SQ) {
                            this.worldMgr.entityMgr.removeEntity(entity)
                            sceneEntity.setAnimation(SlugActivity.Enter, () => {
                                EventBus.publishEvent(new WorldLocationEvent(EventKey.LOCATION_SLUG_GONE, positionComponent))
                                this.worldMgr.sceneMgr.removeMeshGroup(sceneEntity)
                                this.ecs.removeEntity(entity)
                                sceneEntity.dispose()
                            })
                        } else if (!components.has(WorldTargetComponent)) {
                            const path = pathFinder.findShortestPath(slugPos, behaviorComponent.targetEnter, stats, false)
                            if (path && path.locations.length > 0) {
                                this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0], SLUG_ENTER_DISTANCE_SQ))
                            } else {
                                const randomTarget = [positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())].random().getRandomPosition()
                                this.ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                            }
                        }
                        break
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    private changeToIdle(entity: number, sceneEntity: AnimatedSceneEntity, behaviorComponent: SlugBehaviorComponent) {
        this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
        sceneEntity.setAnimation(AnimEntityActivity.Stand)
        behaviorComponent.targetBuilding = null
        behaviorComponent.targetEnter = null
        behaviorComponent.state = SlugBehaviorState.IDLE
    }
}
