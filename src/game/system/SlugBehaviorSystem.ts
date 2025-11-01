import { AbstractGameSystem, ECS, FilteredEntities } from '../ECS'
import { SLUG_BEHAVIOR_STATE, SlugBehaviorComponent } from '../component/SlugBehaviorComponent'
import { WorldManager } from '../WorldManager'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { PositionComponent } from '../component/PositionComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PathTarget } from '../model/PathTarget'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { ANIM_ENTITY_ACTIVITY, SLUG_ACTIVITY } from '../model/anim/AnimationActivity'
import { EventKey } from '../../event/EventKeyEnum'
import { GameState } from '../model/GameState'
import { MaterialAmountChanged, WorldLocationEvent } from '../../event/WorldEvents'
import { SLUG_MAX_IDLE_TIME, SLUG_SUCK_TIME } from '../../params'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { MaterialSpawner } from '../factory/MaterialSpawner'
import { EntityType } from '../model/EntityType'
import { EntityFrozenComponent } from '../component/EntityFrozenComponent'
import { EntityPushedComponent } from '../component/EntityPushedComponent'
import { HeadingComponent } from '../component/HeadingComponent'
import { EventBroker } from '../../event/EventBroker'
import { PRNG } from '../factory/PRNG'
import { UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { MAP_MARKER_CHANGE, MAP_MARKER_TYPE } from '../component/MapMarkerComponent'
import { BirdScarerComponent } from '../component/BirdScarerComponent'

const SLUG_SUCK_DISTANCE_SQ = 25 * 25
const SLUG_ENTER_DISTANCE_SQ = 5 * 5

export class SlugBehaviorSystem extends AbstractGameSystem {
    readonly slugs: FilteredEntities = this.addEntityFilter(SlugBehaviorComponent, MonsterStatsComponent)
    readonly scaryThings: FilteredEntities = this.addEntityFilter(BirdScarerComponent)

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(ecs: ECS, elapsedMs: number): void {
        const pathFinder = this.worldMgr.sceneMgr.terrain?.pathFinder
        const scarerPositions = this.scaryThings.values().map((c) => c.get(BirdScarerComponent))
        for (const [entity, components] of this.slugs) {
            try {
                const behaviorComponent = components.get(SlugBehaviorComponent)
                const positionComponent = components.get(PositionComponent)
                const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
                if (components.has(EntityFrozenComponent) || components.has(EntityPushedComponent)) {
                    this.changeToIdle(sceneEntity, behaviorComponent)
                    continue
                }
                const stats = components.get(MonsterStatsComponent).stats
                const slugPos = positionComponent.getPosition2D()
                switch (behaviorComponent.state) {
                    case SLUG_BEHAVIOR_STATE.idle:
                        if (behaviorComponent.targetBuilding) {
                            behaviorComponent.state = SLUG_BEHAVIOR_STATE.leech
                        } else if (behaviorComponent.energyLeeched) {
                            behaviorComponent.state = SLUG_BEHAVIOR_STATE.goEnter
                        } else if (behaviorComponent.idleTimer > SLUG_MAX_IDLE_TIME) {
                            behaviorComponent.state = SLUG_BEHAVIOR_STATE.goEnter
                        } else if (!components.has(WorldTargetComponent)) {
                            behaviorComponent.idleTimer += elapsedMs
                            const energizedBuildings = this.worldMgr.entityMgr.buildings.filter((b) => b.energized && b.getPosition2D().distanceToSquared(slugPos) < stats.attackRadiusSq)
                            const closestBuilding = pathFinder.findClosestBuilding(slugPos, energizedBuildings, stats, 1)
                            if (closestBuilding) {
                                behaviorComponent.state = SLUG_BEHAVIOR_STATE.leech
                                behaviorComponent.targetBuilding = closestBuilding.obj
                            } else {
                                const randomTarget = PRNG.movement.sample([positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())]).getRandomPosition()
                                ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                                ecs.addComponent(entity, new HeadingComponent(randomTarget))
                            }
                        }
                        break
                    case SLUG_BEHAVIOR_STATE.leech:
                        if (!behaviorComponent.targetBuilding?.energized) {
                            ecs.removeComponent(entity, WorldTargetComponent)
                            ecs.removeComponent(entity, HeadingComponent)
                            this.changeToIdle(sceneEntity, behaviorComponent)
                        } else {
                            const scarerInRange = scarerPositions.find((pos) => pos.position2D.distanceToSquared(slugPos) < stats.alertRadiusSq)
                            if (scarerInRange) {
                                ecs.removeComponent(entity, WorldTargetComponent)
                                ecs.removeComponent(entity, HeadingComponent)
                                this.changeToIdle(sceneEntity, behaviorComponent)
                                const safeNeighbors = scarerInRange.surface.neighbors.filter((s) => s !== scarerInRange.surface)
                                const safePos = (safeNeighbors.find((s) => s.isWalkable()) || scarerInRange.surface).getRandomPosition()
                                ecs.addComponent(entity, new WorldTargetComponent(safePos, SLUG_ENTER_DISTANCE_SQ))
                                ecs.addComponent(entity, new HeadingComponent(safePos))
                            } else {
                                const targetSurface = behaviorComponent.targetBuilding.buildingSurfaces.find((s) => s.getCenterWorld2D().distanceToSquared(slugPos) <= SLUG_SUCK_DISTANCE_SQ)
                                if (targetSurface) {
                                    if (components.has(WorldTargetComponent)) {
                                        sceneEntity.headTowards(targetSurface.getCenterWorld2D())
                                        ecs.removeComponent(entity, WorldTargetComponent)
                                        ecs.removeComponent(entity, HeadingComponent)
                                        EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_POWER_DRAIN, new PositionComponent(positionComponent.position, positionComponent.surface)))
                                    }
                                    sceneEntity.setAnimation(SLUG_ACTIVITY.suck, () => {
                                        GameState.numCrystal--
                                        EventBroker.publish(new MaterialAmountChanged())
                                        MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.DEPLETED_CRYSTAL, positionComponent.getPosition2D())
                                        behaviorComponent.state = SLUG_BEHAVIOR_STATE.goEnter
                                        behaviorComponent.energyLeeched = true
                                    }, SLUG_SUCK_TIME)
                                } else if (!components.has(WorldTargetComponent)) {
                                    const buildingPathTargets = behaviorComponent.targetBuilding.getTrainingTargets()
                                    const path = pathFinder.findShortestPath(slugPos, buildingPathTargets, stats, 1)
                                    if (path && path.locations.length > 0) {
                                        const targetLocation = path.locations[0]
                                        ecs.addComponent(entity, new WorldTargetComponent(targetLocation))
                                        ecs.addComponent(entity, new HeadingComponent(targetLocation))
                                    } else {
                                        console.warn('Slug cannot find path to targets', buildingPathTargets)
                                        ecs.removeComponent(entity, WorldTargetComponent)
                                        ecs.removeComponent(entity, HeadingComponent)
                                        this.changeToIdle(sceneEntity, behaviorComponent)
                                    }
                                }
                            }
                        }
                        break
                    case SLUG_BEHAVIOR_STATE.goEnter:
                        if (!behaviorComponent.targetEnter) {
                            const enterTargets = this.worldMgr.sceneMgr.terrain.slugHoles.map((h) => PathTarget.fromLocation(h.getRandomPosition(), SLUG_ENTER_DISTANCE_SQ))
                            const path = pathFinder.findShortestPath(positionComponent.getPosition2D(), enterTargets, stats, 1)
                            if (path && path.locations.length > 0) {
                                behaviorComponent.targetEnter = path.target
                            } else {
                                const randomTarget = PRNG.movement.sample([positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())]).getRandomPosition()
                                ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                                ecs.addComponent(entity, new HeadingComponent(randomTarget))
                            }
                        } else if (behaviorComponent.targetEnter.targetLocation.distanceToSquared(slugPos) <= SLUG_ENTER_DISTANCE_SQ) {
                            this.worldMgr.entityMgr.removeEntity(entity)
                            sceneEntity.setAnimation(SLUG_ACTIVITY.enter, () => {
                                EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_SLUG_GONE, positionComponent))
                                EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.monster, entity, MAP_MARKER_CHANGE.remove))
                                this.worldMgr.sceneMgr.disposeSceneEntity(sceneEntity)
                                ecs.removeEntity(entity)
                            })
                        } else if (!components.has(WorldTargetComponent)) {
                            const path = pathFinder.findShortestPath(slugPos, behaviorComponent.targetEnter, stats, 1)
                            if (path && path.locations.length > 0) {
                                const targetLocation = path.locations[0]
                                ecs.addComponent(entity, new WorldTargetComponent(targetLocation, SLUG_ENTER_DISTANCE_SQ))
                                ecs.addComponent(entity, new HeadingComponent(targetLocation))
                            } else {
                                const randomTarget = PRNG.movement.sample([positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())]).getRandomPosition()
                                ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                                ecs.addComponent(entity, new HeadingComponent(randomTarget))
                            }
                        }
                        break
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    private changeToIdle(sceneEntity: AnimatedSceneEntity, behaviorComponent: SlugBehaviorComponent) {
        if (behaviorComponent.state === SLUG_BEHAVIOR_STATE.emerge) return
        sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.stand)
        behaviorComponent.targetBuilding = undefined
        behaviorComponent.targetEnter = undefined
        behaviorComponent.state = SLUG_BEHAVIOR_STATE.idle
    }
}
