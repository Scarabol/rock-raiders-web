import { AbstractGameSystem, GameEntity } from '../ECS'
import { RockMonsterBehaviorComponent, RockMonsterBehaviorState } from '../component/RockMonsterBehaviorComponent'
import { WorldManager } from '../WorldManager'
import { EntityType } from '../model/EntityType'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PathTarget } from '../model/PathTarget'
import { AnimEntityActivity, RockMonsterActivity } from '../model/anim/AnimationActivity'
import { SurfaceType } from '../terrain/SurfaceType'
import { WALL_TYPE } from '../terrain/WallType'
import { ResourceManager } from '../../resource/ResourceManager'
import { HealthComponent } from '../component/HealthComponent'
import { EventBus } from '../../event/EventBus'
import { EventKey } from '../../event/EventKeyEnum'
import { WorldLocationEvent } from '../../event/WorldLocationEvent'
import { GameState } from '../model/GameState'
import { PathFinder } from '../terrain/PathFinder'
import { Vector2 } from 'three'
import { MonsterEntityStats } from '../../cfg/GameStatsCfg'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { TILESIZE } from '../../params'

const ROCKY_GRAB_DISTANCE_SQ = 10 * 10
const ROCKY_GATHER_DISTANCE_SQ = 5 * 5
const ROCKY_BOULDER_THROW_DISTANCE_SQ = 80 * 80
const ROCKY_MELEE_ATTACK_DISTANCE_SQ = 30 * 30

export class RockMonsterBehaviorSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([RockMonsterBehaviorComponent, PositionComponent, AnimatedSceneEntityComponent, MonsterStatsComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        const pathFinder = this.worldMgr.sceneMgr.terrain.pathFinder
        const crystals = this.worldMgr.entityMgr.materials.filter((m) => m.entityType === EntityType.CRYSTAL)
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const behaviorComponent = components.get(RockMonsterBehaviorComponent)
                const positionComponent = components.get(PositionComponent)
                const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
                const stats = components.get(MonsterStatsComponent).stats
                const rockyPos = positionComponent.getPosition2D()
                switch (behaviorComponent.state) {
                    case RockMonsterBehaviorState.IDLE:
                        this.doIdle(behaviorComponent, pathFinder, rockyPos, stats, entity, crystals)
                        break
                    case RockMonsterBehaviorState.GOTO_CRYSTAL:
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH) {
                            behaviorComponent.state = RockMonsterBehaviorState.STAMP
                            this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                            this.worldMgr.ecs.addComponent(entity, new WorldTargetComponent(positionComponent.surface.getCenterWorld2D()))
                        } else if (!this.worldMgr.entityMgr.materials.includes(behaviorComponent.targetCrystal)) {
                            behaviorComponent.changeToIdle()
                        } else if (!components.has(WorldTargetComponent)) {
                            const crystalPosition = behaviorComponent.targetCrystal.getPosition2D()
                            if (rockyPos.distanceToSquared(crystalPosition) <= ROCKY_GRAB_DISTANCE_SQ) {
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(behaviorComponent.targetCrystal.getPosition2D()))
                                behaviorComponent.state = RockMonsterBehaviorState.EAT_CRYSTAL
                                sceneEntity.pickupEntity(behaviorComponent.targetCrystal.sceneEntity)
                                behaviorComponent.targetCrystal.targetSite?.removeItem(behaviorComponent.targetCrystal)
                                sceneEntity.setAnimation(RockMonsterActivity.Eat, () => {
                                    sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                    behaviorComponent.numCrystalsEaten++
                                    sceneEntity.removeAllCarried()
                                    behaviorComponent.targetCrystal.disposeFromWorld()
                                    behaviorComponent.changeToIdle()
                                })
                            } else {
                                const crystalPathTarget = [PathTarget.fromLocation(crystalPosition)]
                                const path = pathFinder.findShortestPath(rockyPos, crystalPathTarget, stats, false)
                                if (path && path.locations.length > 0) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0], ROCKY_GRAB_DISTANCE_SQ))
                                } else {
                                    behaviorComponent.changeToIdle()
                                }
                            }
                        }
                        break
                    case RockMonsterBehaviorState.STAMP:
                        if (!components.has(WorldTargetComponent)) {
                            sceneEntity.setAnimation(RockMonsterActivity.Stamp, () => {
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                positionComponent.surface.makeRubble(2)
                                if (behaviorComponent.targetCrystal) {
                                    behaviorComponent.state = RockMonsterBehaviorState.GOTO_CRYSTAL
                                } else if (behaviorComponent.targetWall) {
                                    behaviorComponent.state = RockMonsterBehaviorState.GOTO_WALL
                                } else {
                                    behaviorComponent.changeToIdle()
                                }
                            })
                        }
                        break
                    case RockMonsterBehaviorState.BOULDER_ATTACK:
                        if (behaviorComponent.boulder) {
                            if (!behaviorComponent.targetBuilding) {
                                // TODO only target buildings where boulder damage is > 0
                                // TODO path finding to buildings does not work since surface below buildings are not accessible
                                const closestBuilding = pathFinder.findClosestObj(rockyPos, this.worldMgr.entityMgr.buildings, stats, false)
                                if (closestBuilding) {
                                    behaviorComponent.targetBuilding = closestBuilding.obj
                                } else {
                                    behaviorComponent.state = RockMonsterBehaviorState.GO_HOME
                                }
                            } else if (!this.worldMgr.entityMgr.buildings.includes(behaviorComponent.targetBuilding)) {
                                behaviorComponent.changeToIdle()
                            } else {
                                const targetBuildingSurface = [behaviorComponent.targetBuilding.primarySurface, behaviorComponent.targetBuilding.secondarySurface].filter((s) => !!s).find((s) => rockyPos.distanceToSquared(s.getCenterWorld2D()) <= ROCKY_BOULDER_THROW_DISTANCE_SQ)
                                if (targetBuildingSurface) {
                                    this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                                    sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(targetBuildingSurface.getCenterWorld2D()))
                                    behaviorComponent.state = RockMonsterBehaviorState.THROW
                                    sceneEntity.setAnimation(RockMonsterActivity.Throw, () => {
                                        sceneEntity.setAnimation(behaviorComponent.boulder ? AnimEntityActivity.StandCarry : AnimEntityActivity.Stand)
                                        behaviorComponent.changeToIdle()
                                        sceneEntity.removeAllCarried()
                                        // this.worldMgr.sceneMgr.scene.add(behaviorComponent.boulder) // TODO Add boulder as bullet (component)
                                        this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.BoulderExplode, targetBuildingSurface.getCenterWorld(), 0, false) // TODO adapt to monster/level entity type
                                        this.worldMgr.ecs.getComponents(behaviorComponent.targetBuilding.entity).get(HealthComponent).changeHealth(stats.RepairValue)
                                        behaviorComponent.boulder = null
                                    })
                                } else if (!components.has(WorldTargetComponent)) {
                                    const buildingPathTargets = [behaviorComponent.targetBuilding.primarySurface, behaviorComponent.targetBuilding.secondarySurface].filter((s) => !!s).map((p) => PathTarget.fromLocation(p.getCenterWorld2D(), ROCKY_BOULDER_THROW_DISTANCE_SQ))
                                    const path = pathFinder.findShortestPath(rockyPos, buildingPathTargets, stats, false)
                                    if (path && path.locations.length > 0) {
                                        this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0]))
                                    } else {
                                        behaviorComponent.changeToIdle()
                                    }
                                }
                            }
                        } else {
                            behaviorComponent.targetWall = this.worldMgr.sceneMgr.terrain.findClosestWall(rockyPos)
                            behaviorComponent.state = RockMonsterBehaviorState.GOTO_WALL
                        }
                        break
                    case RockMonsterBehaviorState.MELEE_ATTACK:
                        if (!behaviorComponent.targetBuilding) {
                            // TODO path finding to buildings does not work since surface below buildings are not accessible
                            const closestBuilding = pathFinder.findClosestObj(rockyPos, this.worldMgr.entityMgr.buildings, stats, false)
                            if (closestBuilding) {
                                behaviorComponent.targetBuilding = closestBuilding.obj
                            } else {
                                behaviorComponent.state = RockMonsterBehaviorState.GO_HOME
                            }
                        } else if (!this.worldMgr.entityMgr.buildings.includes(behaviorComponent.targetBuilding)) {
                            behaviorComponent.changeToIdle()
                        } else {
                            const targetBuildingSurface = [behaviorComponent.targetBuilding.primarySurface, behaviorComponent.targetBuilding.secondarySurface].filter((s) => !!s).find((s) => rockyPos.distanceToSquared(s.getCenterWorld2D()) <= ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (targetBuildingSurface) {
                                this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(targetBuildingSurface.getCenterWorld2D()))
                                behaviorComponent.state = RockMonsterBehaviorState.PUNCH
                                sceneEntity.setAnimation(RockMonsterActivity.Punch, () => {
                                    sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                    this.worldMgr.ecs.getComponents(behaviorComponent.targetBuilding.entity).get(HealthComponent).changeHealth(stats.RepairValue)
                                    behaviorComponent.changeToIdle()
                                })
                            } else if (!components.has(WorldTargetComponent)) {
                                const buildingPathTargets = [behaviorComponent.targetBuilding.primarySurface, behaviorComponent.targetBuilding.secondarySurface].filter((s) => !!s).map((p) => PathTarget.fromLocation(p.getCenterWorld2D(), ROCKY_MELEE_ATTACK_DISTANCE_SQ))
                                const path = pathFinder.findShortestPath(rockyPos, buildingPathTargets, stats, false)
                                if (path && path.locations.length > 0) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0]))
                                } else {
                                    behaviorComponent.changeToIdle()
                                }
                            }
                        }
                        break
                    case RockMonsterBehaviorState.GOTO_WALL:
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH) {
                            behaviorComponent.state = RockMonsterBehaviorState.STAMP
                            this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                            this.worldMgr.ecs.addComponent(entity, new WorldTargetComponent(positionComponent.surface.getCenterWorld2D()))
                        } else if (behaviorComponent.targetWall.wallType !== WALL_TYPE.WALL) {
                            behaviorComponent.changeToIdle()
                        } else if (!components.has(WorldTargetComponent)) {
                            if (behaviorComponent.targetWall.getDigPositions().some((p) => rockyPos.distanceToSquared(p) <= ROCKY_GATHER_DISTANCE_SQ)) {
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(behaviorComponent.targetWall.getCenterWorld2D()))
                                behaviorComponent.state = RockMonsterBehaviorState.GATHER
                                sceneEntity.setAnimation(RockMonsterActivity.Gather, () => {
                                    sceneEntity.setAnimation(AnimEntityActivity.StandCarry)
                                    behaviorComponent.boulder = ResourceManager.getLwoModel(ResourceManager.configuration.miscObjects.Boulder) // TODO not textured use BoulderAnimation or vertex colors?
                                    sceneEntity.pickupEntity(behaviorComponent.boulder)
                                    behaviorComponent.changeToIdle()
                                })
                            } else {
                                const wallPathTargets = behaviorComponent.targetWall.getDigPositions().map((p) => PathTarget.fromLocation(p, ROCKY_GATHER_DISTANCE_SQ))
                                const path = pathFinder.findShortestPath(rockyPos, wallPathTargets, stats, false)
                                if (path && path.locations.length > 0) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0], ROCKY_GATHER_DISTANCE_SQ))
                                } else {
                                    behaviorComponent.changeToIdle()
                                }
                            }
                        }
                        break
                    case RockMonsterBehaviorState.GO_HOME:
                        if (!behaviorComponent.targetWall || behaviorComponent.targetWall.wallType !== WALL_TYPE.WALL) {
                            behaviorComponent.targetWall = this.worldMgr.sceneMgr.terrain.findClosestWall(rockyPos)
                        } else if (!components.has(WorldTargetComponent)) {
                            if (behaviorComponent.targetWall.getDigPositions().some((p) => rockyPos.distanceToSquared(p) <= ROCKY_GATHER_DISTANCE_SQ)) {
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(behaviorComponent.targetWall.getCenterWorld2D()))
                                this.worldMgr.entityMgr.rockMonsters.remove(entity)
                                sceneEntity.setAnimation(RockMonsterActivity.Enter, () => {
                                    EventBus.publishEvent(new WorldLocationEvent(EventKey.LOCATION_MONSTER_GONE, positionComponent))
                                    this.worldMgr.sceneMgr.removeMeshGroup(sceneEntity)
                                    this.worldMgr.entityMgr.removeEntity(entity)
                                    this.ecs.removeEntity(entity)
                                    sceneEntity.dispose()
                                })
                            } else {
                                const wallPathTargets = behaviorComponent.targetWall.getDigPositions().map((p) => PathTarget.fromLocation(p, ROCKY_GATHER_DISTANCE_SQ))
                                const path = pathFinder.findShortestPath(rockyPos, wallPathTargets, stats, false)
                                if (path && path.locations.length > 0) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0], ROCKY_GATHER_DISTANCE_SQ))
                                } else {
                                    behaviorComponent.changeToIdle()
                                }
                            }
                        }
                        break
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    private doIdle(behaviorComponent: RockMonsterBehaviorComponent, pathFinder: PathFinder, rockyPos: Vector2, stats: MonsterEntityStats, entity: number, crystals: MaterialEntity[]) {
        if (behaviorComponent.boulder) {
            behaviorComponent.state = RockMonsterBehaviorState.BOULDER_ATTACK
        } else if (GameState.monsterCongregation && GameState.monsterCongregation.getCenterWorld2D().distanceToSquared(rockyPos) > TILESIZE) {
            const path = pathFinder.findShortestPath(rockyPos, [PathTarget.fromLocation(GameState.monsterCongregation.getCenterWorld2D())], stats, false)
            if (path && path.locations.length > 0) {
                this.ecs.addComponent(entity, new WorldTargetComponent(path.locations[0], 1))
                return
            }
        } else if (behaviorComponent.numCrystalsEaten < stats.Capacity && crystals.length > 0) {
            const closestCrystal = pathFinder.findClosestObj(rockyPos, crystals, stats, false) // TODO Use timer to look for crystals to improve performance
            if (closestCrystal) {
                behaviorComponent.state = RockMonsterBehaviorState.GOTO_CRYSTAL
                behaviorComponent.targetCrystal = closestCrystal.obj
            }
        } else {
            behaviorComponent.state = Math.random() < 0.2 ? RockMonsterBehaviorState.BOULDER_ATTACK : RockMonsterBehaviorState.MELEE_ATTACK
        }
    }
}
