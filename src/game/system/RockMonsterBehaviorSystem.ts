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
import { Vector2, Vector3 } from 'three'
import { MonsterEntityStats } from '../../cfg/GameStatsCfg'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { TILESIZE } from '../../params'
import { DynamiteExplosionEvent } from '../../event/WorldEvents'
import { RaiderScareComponent, RaiderScareRange } from '../component/RaiderScareComponent'

const ROCKY_GRAB_DISTANCE_SQ = 10 * 10
const ROCKY_GATHER_DISTANCE_SQ = 5 * 5
const ROCKY_BOULDER_THROW_DISTANCE_SQ = 80 * 80
const ROCKY_MELEE_ATTACK_DISTANCE_SQ = 30 * 30

export class RockMonsterBehaviorSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([RockMonsterBehaviorComponent, PositionComponent, AnimatedSceneEntityComponent, MonsterStatsComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
        EventBus.registerEventListener(EventKey.DYNAMITE_EXPLOSION, (event: DynamiteExplosionEvent) => {
            this.worldMgr.entityMgr.rockMonsters.forEach((m) => {
                const components = this.ecs.getComponents(m)
                const positionComponent = components.get(PositionComponent)
                if (positionComponent.getPosition2D().distanceToSquared(event.position) < Math.pow(ResourceManager.configuration.main.DynamiteDamageRadius, 2)) {
                    components.get(AnimatedSceneEntityComponent).sceneEntity.setAnimation(RockMonsterActivity.WakeUp, () => {
                        this.worldMgr.ecs.addComponent(m, new RaiderScareComponent(RaiderScareRange.ROCKY))
                        this.ecs.addComponent(m, new RockMonsterBehaviorComponent())
                        EventBus.publishEvent(new WorldLocationEvent(EventKey.LOCATION_MONSTER, positionComponent))
                    })
                }
            })
        })
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
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH || positionComponent.surface.surfaceType === SurfaceType.POWER_PATH_BUILDING) {
                            const prevTargetComponent = components.get(WorldTargetComponent)
                            this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                            sceneEntity.setAnimation(RockMonsterActivity.Stamp, () => {
                                if (prevTargetComponent) this.worldMgr.ecs.addComponent(entity, new WorldTargetComponent(prevTargetComponent.position, prevTargetComponent.radiusSq))
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                positionComponent.surface.setSurfaceType(SurfaceType.RUBBLE4)
                                this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.SmashPath, positionComponent.surface.getCenterWorld(), 0, false)
                            })
                        } else {
                            const vehicleInMeleeRange = this.worldMgr.entityMgr.vehicles
                                .find((v) => v.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (vehicleInMeleeRange) {
                                const prevState = behaviorComponent.state
                                this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(vehicleInMeleeRange.getPosition2D()))
                                behaviorComponent.state = RockMonsterBehaviorState.PUNCH
                                sceneEntity.setAnimation(RockMonsterActivity.Punch, () => {
                                    sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                    if (vehicleInMeleeRange.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ) {
                                        this.worldMgr.ecs.getComponents(vehicleInMeleeRange.entity).get(HealthComponent).changeHealth(stats.RepairValue)
                                    }
                                    behaviorComponent.state = prevState
                                })
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
                        }
                        break
                    case RockMonsterBehaviorState.BOULDER_ATTACK:
                        if (behaviorComponent.boulder) {
                            const drivingVehicleCloseBy = this.worldMgr.entityMgr.vehicles
                                .find((v) => v.sceneEntity.currentAnimation === AnimEntityActivity.Route && v.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (drivingVehicleCloseBy) {
                                this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.BoulderExplode, behaviorComponent.boulder.getWorldPosition(new Vector3()), behaviorComponent.boulder.rotation.y, false)
                                sceneEntity.removeAllCarried()
                                behaviorComponent.boulder = null
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                            } else if (!behaviorComponent.targetBuilding) {
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
                                        // this.worldMgr.sceneMgr.scene.add(behaviorComponent.boulder) // TODO Add boulder as bullet (component)
                                        this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.BoulderExplode, targetBuildingSurface.getCenterWorld(), 0, false) // TODO adapt to monster/level entity type
                                        const boulderStats = ResourceManager.configuration.weaponTypes.get('boulder')
                                        const boulderDamage = boulderStats.damageByEntityType.get(behaviorComponent.targetBuilding.entityType)?.[behaviorComponent.targetBuilding.level] || boulderStats.defaultDamage
                                        this.worldMgr.ecs.getComponents(behaviorComponent.targetBuilding.entity).get(HealthComponent).changeHealth(-boulderDamage)
                                        sceneEntity.removeAllCarried()
                                        behaviorComponent.boulder = null
                                        sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                        behaviorComponent.changeToIdle()
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
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH || positionComponent.surface.surfaceType === SurfaceType.POWER_PATH_BUILDING) {
                            const prevTargetComponent = components.get(WorldTargetComponent)
                            this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                            sceneEntity.setAnimation(RockMonsterActivity.Stamp, () => {
                                if (prevTargetComponent) this.worldMgr.ecs.addComponent(entity, new WorldTargetComponent(prevTargetComponent.position, prevTargetComponent.radiusSq))
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                positionComponent.surface.setSurfaceType(SurfaceType.RUBBLE4)
                                this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.SmashPath, positionComponent.surface.getCenterWorld(), 0, false)
                            })
                        } else {
                            const vehicleInMeleeRange = this.worldMgr.entityMgr.vehicles
                                .find((v) => v.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (vehicleInMeleeRange) {
                                const prevState = behaviorComponent.state
                                this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(vehicleInMeleeRange.getPosition2D()))
                                behaviorComponent.state = RockMonsterBehaviorState.PUNCH
                                sceneEntity.setAnimation(RockMonsterActivity.Punch, () => {
                                    sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                    if (vehicleInMeleeRange.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ) {
                                        this.worldMgr.ecs.getComponents(vehicleInMeleeRange.entity).get(HealthComponent).changeHealth(stats.RepairValue)
                                    }
                                    behaviorComponent.state = prevState
                                })
                            } else if (!behaviorComponent.targetBuilding) {
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
                        }
                        break
                    case RockMonsterBehaviorState.GOTO_WALL:
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH || positionComponent.surface.surfaceType === SurfaceType.POWER_PATH_BUILDING) {
                            const prevTargetComponent = components.get(WorldTargetComponent)
                            this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                            sceneEntity.setAnimation(RockMonsterActivity.Stamp, () => {
                                if (prevTargetComponent) this.worldMgr.ecs.addComponent(entity, new WorldTargetComponent(prevTargetComponent.position, prevTargetComponent.radiusSq))
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                positionComponent.surface.setSurfaceType(SurfaceType.RUBBLE4)
                                this.worldMgr.sceneMgr.addMiscAnim(ResourceManager.configuration.miscObjects.SmashPath, positionComponent.surface.getCenterWorld(), 0, false)
                            })
                        } else {
                            const vehicleInMeleeRange = this.worldMgr.entityMgr.vehicles
                                .find((v) => v.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (vehicleInMeleeRange) {
                                const prevState = behaviorComponent.state
                                this.worldMgr.ecs.removeComponent(entity, WorldTargetComponent)
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(vehicleInMeleeRange.getPosition2D()))
                                behaviorComponent.state = RockMonsterBehaviorState.PUNCH
                                sceneEntity.setAnimation(RockMonsterActivity.Punch, () => {
                                    sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                    if (vehicleInMeleeRange.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ) {
                                        this.worldMgr.ecs.getComponents(vehicleInMeleeRange.entity).get(HealthComponent).changeHealth(stats.RepairValue)
                                    }
                                    behaviorComponent.state = prevState
                                })
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
                        }
                        break
                    case RockMonsterBehaviorState.GO_HOME:
                        if (!behaviorComponent.targetWall || behaviorComponent.targetWall.wallType !== WALL_TYPE.WALL) {
                            behaviorComponent.targetWall = this.worldMgr.sceneMgr.terrain.findClosestWall(rockyPos)
                        } else if (!components.has(WorldTargetComponent)) {
                            if (behaviorComponent.targetWall.getDigPositions().some((p) => rockyPos.distanceToSquared(p) <= ROCKY_GATHER_DISTANCE_SQ)) {
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(behaviorComponent.targetWall.getCenterWorld2D()))
                                this.worldMgr.entityMgr.removeEntity(entity)
                                sceneEntity.setAnimation(RockMonsterActivity.Enter, () => {
                                    EventBus.publishEvent(new WorldLocationEvent(EventKey.LOCATION_MONSTER_GONE, positionComponent))
                                    this.worldMgr.sceneMgr.removeMeshGroup(sceneEntity)
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
            const closestCrystal = pathFinder.findClosestObj(rockyPos, crystals, stats, false)
            if (closestCrystal) {
                behaviorComponent.state = RockMonsterBehaviorState.GOTO_CRYSTAL
                behaviorComponent.targetCrystal = closestCrystal.obj
            } else {
                behaviorComponent.state = Math.random() < 0.2 ? RockMonsterBehaviorState.BOULDER_ATTACK : RockMonsterBehaviorState.MELEE_ATTACK
            }
        } else {
            behaviorComponent.state = Math.random() < 0.2 ? RockMonsterBehaviorState.BOULDER_ATTACK : RockMonsterBehaviorState.MELEE_ATTACK
        }
    }
}
