import { AbstractGameSystem, GameEntity } from '../ECS'
import { SlugBehaviorComponent, SlugBehaviorState } from '../component/SlugBehaviorComponent'
import { WorldManager } from '../WorldManager'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { PositionComponent } from '../component/PositionComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PathTarget } from '../model/PathTarget'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { AnimEntityActivity, SlugActivity } from '../model/anim/AnimationActivity'
import { PowerDrainEvent, WorldLocationEvent } from '../../event/WorldLocationEvent'
import { EventKey } from '../../event/EventKeyEnum'
import { GameState } from '../model/GameState'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { SLUG_MAX_IDLE_TIME, SLUG_SUCK_TIME } from '../../params'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { MaterialSpawner } from '../factory/MaterialSpawner'
import { EntityType } from '../model/EntityType'
import { EntityFrozenComponent } from '../component/EntityFrozenComponent'
import { EntityPushedComponent } from '../component/EntityPushedComponent'
import { HeadingComponent } from '../component/HeadingComponent'
import { EventBroker } from '../../event/EventBroker'
import { PRNG } from '../factory/PRNG'

const SLUG_SUCK_DISTANCE_SQ = 25 * 25
const SLUG_ENTER_DISTANCE_SQ = 5 * 5

export class SlugBehaviorSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([SlugBehaviorComponent, MonsterStatsComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        const pathFinder = this.worldMgr.sceneMgr.terrain?.pathFinder
        const scarerPositions = this.worldMgr.entityMgr.birdScarer.map((b) => this.ecs.getComponents(b).get(PositionComponent))
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
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
                    case SlugBehaviorState.IDLE:
                        if (behaviorComponent.targetBuilding) {
                            behaviorComponent.state = SlugBehaviorState.LEECH
                        } else if (behaviorComponent.energyLeeched) {
                            behaviorComponent.state = SlugBehaviorState.GO_ENTER
                        } else if (behaviorComponent.idleTimer > SLUG_MAX_IDLE_TIME) {
                            behaviorComponent.state = SlugBehaviorState.GO_ENTER
                        } else if (!components.has(WorldTargetComponent)) {
                            behaviorComponent.idleTimer += elapsedMs
                            const energizedBuildings = this.worldMgr.entityMgr.buildings.filter((b) => b.energized && b.getPosition2D().distanceToSquared(slugPos) < stats.AttackRadiusSq)
                            const closestBuilding = pathFinder.findClosestBuilding(slugPos, energizedBuildings, stats, 1)
                            if (closestBuilding) {
                                behaviorComponent.state = SlugBehaviorState.LEECH
                                behaviorComponent.targetBuilding = closestBuilding.obj
                            } else {
                                const randomTarget = PRNG.movement.sample([positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())]).getRandomPosition()
                                this.ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                                this.ecs.addComponent(entity, new HeadingComponent(randomTarget))
                            }
                        }
                        break
                    case SlugBehaviorState.LEECH:
                        if (!behaviorComponent.targetBuilding?.energized) {
                            this.ecs.removeComponent(entity, WorldTargetComponent)
                            this.worldMgr.ecs.removeComponent(entity, HeadingComponent)
                            this.changeToIdle(sceneEntity, behaviorComponent)
                        } else {
                            // console.log('Checking scarer', scarerPositions.map((pos) => pos.getPosition2D().distanceToSquared(slugPos)))
                            const scarerInRange = scarerPositions.find((pos) => pos.getPosition2D().distanceToSquared(slugPos) < stats.AlertRadiusSq)
                            if (scarerInRange) {
                                this.ecs.removeComponent(entity, WorldTargetComponent)
                                this.worldMgr.ecs.removeComponent(entity, HeadingComponent)
                                this.changeToIdle(sceneEntity, behaviorComponent)
                                const safeNeighbors = scarerInRange.surface.neighbors.filter((s) => s !== scarerInRange.surface)
                                const safePos = (safeNeighbors.find((s) => s.isWalkable()) || scarerInRange.surface).getRandomPosition()
                                this.ecs.addComponent(entity, new WorldTargetComponent(safePos, SLUG_ENTER_DISTANCE_SQ))
                                this.ecs.addComponent(entity, new HeadingComponent(safePos))
                            } else {
                                const targetSurface = behaviorComponent.targetBuilding.buildingSurfaces.find((s) => s.getCenterWorld2D().distanceToSquared(slugPos) <= SLUG_SUCK_DISTANCE_SQ)
                                if (targetSurface) {
                                    if (components.has(WorldTargetComponent)) {
                                        sceneEntity.headTowards(targetSurface.getCenterWorld2D())
                                        this.ecs.removeComponent(entity, WorldTargetComponent)
                                        this.worldMgr.ecs.removeComponent(entity, HeadingComponent)
                                        EventBroker.publish(new PowerDrainEvent(new PositionComponent(positionComponent.position, positionComponent.surface)))
                                    }
                                    sceneEntity.setAnimation(SlugActivity.Suck, () => {
                                        GameState.numCrystal--
                                        EventBroker.publish(new MaterialAmountChanged())
                                        MaterialSpawner.spawnMaterial(this.worldMgr, EntityType.DEPLETED_CRYSTAL, positionComponent.getPosition2D())
                                        behaviorComponent.state = SlugBehaviorState.GO_ENTER
                                        behaviorComponent.energyLeeched = true
                                    }, SLUG_SUCK_TIME)
                                } else if (!components.has(WorldTargetComponent)) {
                                    const buildingPathTargets = behaviorComponent.targetBuilding.getTrainingTargets()
                                    const path = pathFinder.findShortestPath(slugPos, buildingPathTargets, stats, 1)
                                    if (path && path.locations.length > 0) {
                                        const targetLocation = path.locations[0]
                                        this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation))
                                        this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
                                    } else {
                                        console.warn('Slug cannot find path to targets', buildingPathTargets)
                                        this.ecs.removeComponent(entity, WorldTargetComponent)
                                        this.worldMgr.ecs.removeComponent(entity, HeadingComponent)
                                        this.changeToIdle(sceneEntity, behaviorComponent)
                                    }
                                }
                            }
                        }
                        break
                    case SlugBehaviorState.GO_ENTER:
                        if (!behaviorComponent.targetEnter) {
                            const enterTargets = this.worldMgr.sceneMgr.terrain.slugHoles.map((h) => PathTarget.fromLocation(h.getRandomPosition(), SLUG_ENTER_DISTANCE_SQ))
                            const path = pathFinder.findShortestPath(positionComponent.getPosition2D(), enterTargets, stats, 1)
                            if (path && path.locations.length > 0) {
                                behaviorComponent.targetEnter = path.target
                            } else {
                                const randomTarget = PRNG.movement.sample([positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())]).getRandomPosition()
                                this.ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                                this.ecs.addComponent(entity, new HeadingComponent(randomTarget))
                            }
                        } else if (behaviorComponent.targetEnter.targetLocation.distanceToSquared(slugPos) <= SLUG_ENTER_DISTANCE_SQ) {
                            this.worldMgr.entityMgr.removeEntity(entity)
                            sceneEntity.setAnimation(SlugActivity.Enter, () => {
                                EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_SLUG_GONE, positionComponent))
                                this.worldMgr.sceneMgr.disposeSceneEntity(sceneEntity)
                                this.ecs.removeEntity(entity)
                            })
                        } else if (!components.has(WorldTargetComponent)) {
                            const path = pathFinder.findShortestPath(slugPos, behaviorComponent.targetEnter, stats, 1)
                            if (path && path.locations.length > 0) {
                                const targetLocation = path.locations[0]
                                this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation, SLUG_ENTER_DISTANCE_SQ))
                                this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
                            } else {
                                const randomTarget = PRNG.movement.sample([positionComponent.surface, ...positionComponent.surface.neighbors.filter((n) => n.isWalkable())]).getRandomPosition()
                                this.ecs.addComponent(entity, new WorldTargetComponent(randomTarget, SLUG_ENTER_DISTANCE_SQ))
                                this.ecs.addComponent(entity, new HeadingComponent(randomTarget))
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
        if (behaviorComponent.state === SlugBehaviorState.EMERGE) return
        sceneEntity.setAnimation(AnimEntityActivity.Stand)
        behaviorComponent.targetBuilding = undefined
        behaviorComponent.targetEnter = undefined
        behaviorComponent.state = SlugBehaviorState.IDLE
    }
}
