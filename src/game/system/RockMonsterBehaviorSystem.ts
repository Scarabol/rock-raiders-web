import { AbstractGameSystem, GameEntity } from '../ECS'
import { RockMonsterBehaviorComponent, RockMonsterBehaviorState } from '../component/RockMonsterBehaviorComponent'
import { WorldManager } from '../WorldManager'
import { EntityType } from '../model/EntityType'
import { PositionComponent } from '../component/PositionComponent'
import { AnimatedSceneEntityComponent } from '../component/AnimatedSceneEntityComponent'
import { MonsterStatsComponent } from '../component/MonsterStatsComponent'
import { WorldTargetComponent } from '../component/WorldTargetComponent'
import { PathTarget } from '../model/PathTarget'
import { AnimEntityActivity, RaiderActivity, RockMonsterActivity } from '../model/anim/AnimationActivity'
import { SurfaceType } from '../terrain/SurfaceType'
import { WALL_TYPE } from '../terrain/WallType'
import { ResourceManager } from '../../resource/ResourceManager'
import { HealthComponent } from '../component/HealthComponent'
import { EventKey } from '../../event/EventKeyEnum'
import { GameState } from '../model/GameState'
import { PathFinder } from '../terrain/PathFinder'
import { Euler, Vector2, Vector3 } from 'three'
import { MonsterEntityStats } from '../../cfg/GameStatsCfg'
import { MaterialEntity } from '../model/material/MaterialEntity'
import { TILESIZE } from '../../params'
import { DynamiteExplosionEvent, MonsterLaserHitEvent, WorldLocationEvent } from '../../event/WorldEvents'
import { RaiderScareComponent, RaiderScareRange } from '../component/RaiderScareComponent'
import { AnimatedSceneEntity } from '../../scene/AnimatedSceneEntity'
import { Raider } from '../model/raider/Raider'
import { EntityFrozenComponent } from '../component/EntityFrozenComponent'
import { EntityPushedComponent } from '../component/EntityPushedComponent'
import { BoulderComponent } from '../component/BoulderComponent'
import { VehicleTarget } from '../EntityManager'
import { HeadingComponent } from '../component/HeadingComponent'
import { BeamUpComponent } from '../component/BeamUpComponent'
import { GameConfig } from '../../cfg/GameConfig'
import { EventBroker } from '../../event/EventBroker'
import { PRNG } from '../factory/PRNG'
import { UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { MapMarkerChange, MapMarkerType } from '../component/MapMarkerComponent'

const ROCKY_GRAB_DISTANCE_SQ = 10 * 10
const ROCKY_GATHER_DISTANCE_SQ = 5 * 5
const ROCKY_BOULDER_THROW_DISTANCE_SQ = 80 * 80
const ROCKY_MELEE_ATTACK_DISTANCE_SQ = 30 * 30

export class RockMonsterBehaviorSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([RockMonsterBehaviorComponent, PositionComponent, AnimatedSceneEntityComponent, MonsterStatsComponent])

    constructor(readonly worldMgr: WorldManager) {
        super()
        EventBroker.subscribe(EventKey.DYNAMITE_EXPLOSION, (event: DynamiteExplosionEvent) => {
            this.worldMgr.entityMgr.rockMonsters.forEach((m) => {
                const components = this.ecs.getComponents(m)
                const positionComponent = components.get(PositionComponent)
                if (positionComponent.getPosition2D().distanceToSquared(event.position) < Math.pow(GameConfig.instance.main.DynamiteDamageRadius, 2)) {
                    components.get(AnimatedSceneEntityComponent).sceneEntity.setAnimation(RockMonsterActivity.WakeUp, () => {
                        this.ecs.addComponent(m, new RaiderScareComponent(RaiderScareRange.ROCKY))
                        this.ecs.addComponent(m, new RockMonsterBehaviorComponent())
                        EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_MONSTER, positionComponent))
                    })
                }
            })
        })
        EventBroker.subscribe(EventKey.MONSTER_LASER_HIT, (event: MonsterLaserHitEvent) => {
            const components = this.ecs.getComponents(event.entity)
            const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
            sceneEntity.removeAllCarried()
            let behaviorComponent = components.get(RockMonsterBehaviorComponent)
            if (behaviorComponent) {
                behaviorComponent.boulder = undefined
                behaviorComponent.changeToIdle()
                behaviorComponent.state = RockMonsterBehaviorState.HIT_BY_LASER
            }
            const healthComponent = components.get(HealthComponent)
            // TODO How does laser beam shot damage work in original?
            const laserDamage = (4 + PRNG.damage.randInt(2)) * event.weaponCfg.defaultDamage
            healthComponent.changeHealth(-laserDamage)
            sceneEntity.setAnimation(RockMonsterActivity.HitHard, () => {
                if (!behaviorComponent) {
                    this.ecs.addComponent(event.entity, new RaiderScareComponent(RaiderScareRange.ROCKY))
                    behaviorComponent = this.ecs.addComponent(event.entity, new RockMonsterBehaviorComponent())
                    const positionComponent = components.get(PositionComponent)
                    EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_MONSTER, positionComponent))
                }
                behaviorComponent.state = RockMonsterBehaviorState.IDLE
            })
        })
    }

    update(elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void {
        const pathFinder = this.worldMgr.sceneMgr.terrain?.pathFinder
        const crystals = this.worldMgr.entityMgr.materials.filter((m) => m.entityType === EntityType.CRYSTAL)
        const drivingVehiclePositions = this.worldMgr.entityMgr.vehicles
            .filter((v) => v.sceneEntity.currentAnimation === AnimEntityActivity.Route)
            .map((v) => this.ecs.getComponents(v.entity).get(PositionComponent).getPosition2D())
        const monsterTargetBuildings = GameState.monsterAttackPowerStation ? this.worldMgr.entityMgr.buildings.filter((b) => b.entityType === EntityType.POWER_STATION) : this.worldMgr.entityMgr.buildings
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const behaviorComponent = components.get(RockMonsterBehaviorComponent)
                const positionComponent = components.get(PositionComponent)
                const sceneEntity = components.get(AnimatedSceneEntityComponent).sceneEntity
                if (components.has(EntityFrozenComponent) || components.has(EntityPushedComponent)) {
                    sceneEntity.removeAllCarried()
                    behaviorComponent.boulder = undefined
                    sceneEntity.setAnimation(AnimEntityActivity.Stand)
                    behaviorComponent.changeToIdle()
                    continue
                }
                const stats = components.get(MonsterStatsComponent).stats
                const rockyPos = positionComponent.getPosition2D()
                const targetBuilding = behaviorComponent.targetBuilding
                const targetWall = behaviorComponent.targetWall
                switch (behaviorComponent.state) {
                    case RockMonsterBehaviorState.IDLE:
                        this.doIdle(behaviorComponent, pathFinder, rockyPos, stats, entity, crystals)
                        break
                    case RockMonsterBehaviorState.GOTO_CRYSTAL:
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH) {
                            const prevTargetComponent = components.get(WorldTargetComponent)
                            this.ecs.removeComponent(entity, WorldTargetComponent)
                            this.ecs.removeComponent(entity, HeadingComponent)
                            sceneEntity.setAnimation(RockMonsterActivity.Stamp, () => {
                                if (prevTargetComponent) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(prevTargetComponent.position, prevTargetComponent.radiusSq))
                                    this.ecs.addComponent(entity, new HeadingComponent(prevTargetComponent.position))
                                }
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                            }, 0, () => {
                                positionComponent.surface.setSurfaceType(SurfaceType.RUBBLE4)
                                this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.smashPath, positionComponent.surface.getCenterWorld(), 0, false)
                            })
                        } else {
                            const vehicleInMeleeRange = this.worldMgr.entityMgr.findVehicleInRange(rockyPos, ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (vehicleInMeleeRange) {
                                this.punchVehicle(behaviorComponent, entity, sceneEntity, vehicleInMeleeRange, rockyPos, stats)
                            } else {
                                const raiderInGrabRange = this.worldMgr.entityMgr.raiders
                                    .find((r) => !r.thrown && r.getPosition2D().distanceToSquared(rockyPos) < ROCKY_GRAB_DISTANCE_SQ)
                                const targetCrystal = behaviorComponent.targetCrystal
                                if (raiderInGrabRange) {
                                    this.throwRaider(behaviorComponent, entity, sceneEntity, raiderInGrabRange, positionComponent)
                                } else if (!targetCrystal || !this.worldMgr.entityMgr.materials.includes(targetCrystal)) {
                                    behaviorComponent.changeToIdle()
                                } else if (!components.has(WorldTargetComponent)) {
                                    const crystalPosition = targetCrystal.getPosition2D()
                                    if (rockyPos.distanceToSquared(crystalPosition) <= ROCKY_GRAB_DISTANCE_SQ) {
                                        sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(targetCrystal.getPosition2D()))
                                        behaviorComponent.state = RockMonsterBehaviorState.EAT_CRYSTAL
                                        sceneEntity.pickupEntity(targetCrystal.sceneEntity)
                                        targetCrystal.targetSite?.removeItem(targetCrystal)
                                        sceneEntity.setAnimation(RockMonsterActivity.Eat, () => {
                                            sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                            behaviorComponent.numCrystalsEaten++
                                            sceneEntity.removeAllCarried()
                                            targetCrystal.disposeFromWorld()
                                            behaviorComponent.changeToIdle()
                                        })
                                    } else {
                                        const crystalPathTarget = [PathTarget.fromLocation(crystalPosition)]
                                        const path = pathFinder.findShortestPath(rockyPos, crystalPathTarget, stats, 1)
                                        if (path && path.locations.length > 0) {
                                            const targetLocation = path.locations[0]
                                            this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation, ROCKY_GRAB_DISTANCE_SQ))
                                            this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
                                        } else {
                                            behaviorComponent.changeToIdle()
                                        }
                                    }
                                }
                            }
                        }
                        break
                    case RockMonsterBehaviorState.BOULDER_ATTACK:
                        if (behaviorComponent.boulder) {
                            const drivingVehicleCloseBy = drivingVehiclePositions.find((pos) => pos.distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (drivingVehicleCloseBy) {
                                this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.boulderExplode, behaviorComponent.boulder.getWorldPosition(new Vector3()), behaviorComponent.boulder.rotation.y, false)
                                sceneEntity.removeAllCarried()
                                behaviorComponent.boulder = undefined
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                            } else if (!targetBuilding) {
                                const closestBuilding = pathFinder.findClosestBuilding(rockyPos, monsterTargetBuildings, stats, 1)
                                if (closestBuilding) {
                                    behaviorComponent.targetBuilding = closestBuilding.obj
                                } else {
                                    behaviorComponent.state = RockMonsterBehaviorState.GO_HOME
                                }
                            } else if (this.ecs.getComponents(targetBuilding.entity).has(BeamUpComponent) || !monsterTargetBuildings.includes(targetBuilding)) {
                                behaviorComponent.changeToIdle()
                            } else {
                                const targetBuildingSurface = targetBuilding.buildingSurfaces.find((s) => rockyPos.distanceToSquared(s.getCenterWorld2D()) <= ROCKY_BOULDER_THROW_DISTANCE_SQ)
                                if (targetBuildingSurface) {
                                    this.ecs.removeComponent(entity, WorldTargetComponent)
                                    this.ecs.removeComponent(entity, HeadingComponent)
                                    const targetLocation = targetBuildingSurface.getCenterWorld2D()
                                    sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(targetLocation))
                                    behaviorComponent.state = RockMonsterBehaviorState.THROW
                                    sceneEntity.setAnimation(RockMonsterActivity.Throw, () => {
                                        sceneEntity.removeAllCarried()
                                        if (behaviorComponent.boulder) {
                                            behaviorComponent.boulder.lookAt(targetBuildingSurface.getCenterWorld())
                                            this.worldMgr.sceneMgr.scene.add(behaviorComponent.boulder)
                                            const bulletEntity = this.ecs.addEntity()
                                            this.ecs.addComponent(bulletEntity, new BoulderComponent(EntityType.BOULDER, behaviorComponent.boulder, targetBuilding.entity, targetBuilding.buildingType, targetBuilding.level, targetLocation))
                                            this.worldMgr.entityMgr.addEntity(bulletEntity, EntityType.BOULDER)
                                        }
                                        behaviorComponent.boulder = undefined
                                        sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                        behaviorComponent.changeToIdle()
                                    })
                                } else if (!components.has(WorldTargetComponent)) {
                                    const buildingPathTargets = targetBuilding.getTrainingTargets()
                                    const path = pathFinder.findShortestPath(rockyPos, buildingPathTargets, stats, 1)
                                    if (path && path.locations.length > 0) {
                                        const targetLocation = path.locations[0]
                                        this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation))
                                        this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
                                    } else {
                                        console.warn('Rocky cannot find path to targets', buildingPathTargets)
                                        behaviorComponent.changeToIdle()
                                    }
                                } else {
                                    // XXX Adjust balancing for resting
                                    const chanceToRestPerSecond = stats.restPercent / 20
                                    if (PRNG.movement.random() < chanceToRestPerSecond * elapsedMs / 1000) {
                                        const prevState = behaviorComponent.state
                                        behaviorComponent.state = RockMonsterBehaviorState.RESTING
                                        this.ecs.removeComponent(entity, WorldTargetComponent)
                                        this.ecs.removeComponent(entity, HeadingComponent)
                                        sceneEntity.setAnimation(RockMonsterActivity.Rest, () => {
                                            behaviorComponent.state = prevState
                                        })
                                    }
                                }
                            }
                        } else {
                            behaviorComponent.targetWall = this.worldMgr.sceneMgr.terrain.findClosestWall(rockyPos)
                            behaviorComponent.state = RockMonsterBehaviorState.GOTO_WALL
                        }
                        break
                    case RockMonsterBehaviorState.MELEE_ATTACK:
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH) {
                            const prevTargetComponent = components.get(WorldTargetComponent)
                            this.ecs.removeComponent(entity, WorldTargetComponent)
                            this.ecs.removeComponent(entity, HeadingComponent)
                            sceneEntity.setAnimation(RockMonsterActivity.Stamp, () => {
                                if (prevTargetComponent) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(prevTargetComponent.position, prevTargetComponent.radiusSq))
                                    this.ecs.addComponent(entity, new HeadingComponent(prevTargetComponent.position))
                                }
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                            }, 0, () => {
                                positionComponent.surface.setSurfaceType(SurfaceType.RUBBLE4)
                                this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.smashPath, positionComponent.surface.getCenterWorld(), 0, false)
                            })
                        } else {
                            const vehicleInMeleeRange = this.worldMgr.entityMgr.findVehicleInRange(rockyPos, ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (vehicleInMeleeRange) {
                                this.punchVehicle(behaviorComponent, entity, sceneEntity, vehicleInMeleeRange, rockyPos, stats)
                            } else {
                                const raiderInGrabRange = this.worldMgr.entityMgr.raiders
                                    .find((r) => !r.thrown && r.getPosition2D().distanceToSquared(rockyPos) < ROCKY_GRAB_DISTANCE_SQ)
                                if (raiderInGrabRange) {
                                    this.throwRaider(behaviorComponent, entity, sceneEntity, raiderInGrabRange, positionComponent)
                                } else if (!targetBuilding) {
                                    const closestBuilding = pathFinder.findClosestBuilding(rockyPos, monsterTargetBuildings, stats, 1)
                                    if (closestBuilding) {
                                        behaviorComponent.targetBuilding = closestBuilding.obj
                                    } else {
                                        behaviorComponent.state = RockMonsterBehaviorState.GO_HOME
                                    }
                                } else if (this.ecs.getComponents(targetBuilding.entity).has(BeamUpComponent) || !monsterTargetBuildings.includes(targetBuilding)) {
                                    behaviorComponent.changeToIdle()
                                } else {
                                    const targetBuildingSurface = targetBuilding.buildingSurfaces.find((s) => rockyPos.distanceToSquared(s.getCenterWorld2D()) <= ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                                    if (targetBuildingSurface) {
                                        this.ecs.removeComponent(entity, WorldTargetComponent)
                                        this.ecs.removeComponent(entity, HeadingComponent)
                                        sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(targetBuildingSurface.getCenterWorld2D()))
                                        behaviorComponent.state = RockMonsterBehaviorState.PUNCH
                                        sceneEntity.setAnimation(RockMonsterActivity.Punch, () => {
                                            sceneEntity.setAnimation(AnimEntityActivity.Stand)
                                            behaviorComponent.changeToIdle()
                                        }, 0, () => {
                                            const buildingComponents = this.ecs.getComponents(targetBuilding.entity)
                                            const healthComponent = buildingComponents.get(HealthComponent)
                                            healthComponent.changeHealth(stats.repairValue)
                                            if (healthComponent.triggerAlarm) EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_UNDER_ATTACK, buildingComponents.get(PositionComponent)))
                                        })
                                    } else if (!components.has(WorldTargetComponent)) {
                                        const buildingPathTargets = targetBuilding.getTrainingTargets()
                                        const path = pathFinder.findShortestPath(rockyPos, buildingPathTargets, stats, 1)
                                        if (path && path.locations.length > 0) {
                                            const targetLocation = path.locations[0]
                                            this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation))
                                            this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
                                        } else {
                                            console.warn('Rocky cannot find path to targets', buildingPathTargets)
                                            behaviorComponent.changeToIdle()
                                        }
                                    }
                                }
                            }
                        }
                        break
                    case RockMonsterBehaviorState.GOTO_WALL:
                        if (positionComponent.surface.surfaceType === SurfaceType.POWER_PATH) {
                            const prevTargetComponent = components.get(WorldTargetComponent)
                            this.ecs.removeComponent(entity, WorldTargetComponent)
                            this.ecs.removeComponent(entity, HeadingComponent)
                            sceneEntity.setAnimation(RockMonsterActivity.Stamp, () => {
                                if (prevTargetComponent) {
                                    this.ecs.addComponent(entity, new WorldTargetComponent(prevTargetComponent.position, prevTargetComponent.radiusSq))
                                    this.ecs.addComponent(entity, new HeadingComponent(prevTargetComponent.position))
                                }
                                sceneEntity.setAnimation(AnimEntityActivity.Stand)
                            }, 0, () => {
                                positionComponent.surface.setSurfaceType(SurfaceType.RUBBLE4)
                                this.worldMgr.sceneMgr.addMiscAnim(GameConfig.instance.miscObjects.smashPath, positionComponent.surface.getCenterWorld(), 0, false)
                            })
                        } else {
                            const vehicleInMeleeRange = this.worldMgr.entityMgr.findVehicleInRange(rockyPos, ROCKY_MELEE_ATTACK_DISTANCE_SQ)
                            if (vehicleInMeleeRange) {
                                this.punchVehicle(behaviorComponent, entity, sceneEntity, vehicleInMeleeRange, rockyPos, stats)
                            } else {
                                const raiderInGrabRange = this.worldMgr.entityMgr.raiders
                                    .find((r) => !r.thrown && r.getPosition2D().distanceToSquared(rockyPos) < ROCKY_GRAB_DISTANCE_SQ)
                                if (raiderInGrabRange) {
                                    this.throwRaider(behaviorComponent, entity, sceneEntity, raiderInGrabRange, positionComponent)
                                } else if (targetWall?.wallType !== WALL_TYPE.WALL) {
                                    behaviorComponent.changeToIdle()
                                } else if (!components.has(WorldTargetComponent)) {
                                    if (targetWall.getDigPositions().some((p) => rockyPos.distanceToSquared(p) <= ROCKY_GATHER_DISTANCE_SQ)) {
                                        sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(targetWall.getCenterWorld2D()))
                                        behaviorComponent.state = RockMonsterBehaviorState.GATHER
                                        sceneEntity.setAnimation(RockMonsterActivity.Gather, () => {
                                            sceneEntity.setAnimation(AnimEntityActivity.StandCarry)
                                            behaviorComponent.boulder = ResourceManager.getLwoModel(GameConfig.instance.miscObjects.boulder)
                                            if (!behaviorComponent.boulder) throw new Error(`Cannot spawn boulder missing mesh "${GameConfig.instance.miscObjects.boulder}"`)
                                            const boulderTexture = ResourceManager.getTexture('Creatures/RMonster/greyrock.bmp') // XXX Read boulder texture from config?
                                            if (boulderTexture) behaviorComponent.boulder.material.forEach((m) => m.map = boulderTexture)
                                            sceneEntity.pickupEntity(behaviorComponent.boulder)
                                            behaviorComponent.changeToIdle()
                                        })
                                    } else {
                                        const wallPathTargets = targetWall.getDigPositions().map((p) => PathTarget.fromLocation(p, ROCKY_GATHER_DISTANCE_SQ))
                                        const path = pathFinder.findShortestPath(rockyPos, wallPathTargets, stats, 1)
                                        if (path && path.locations.length > 0) {
                                            const targetLocation = path.locations[0]
                                            this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation, ROCKY_GATHER_DISTANCE_SQ))
                                            this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
                                        } else {
                                            behaviorComponent.changeToIdle()
                                        }
                                    }
                                }
                            }
                        }
                        break
                    case RockMonsterBehaviorState.GO_HOME:
                        if (!targetWall || targetWall.wallType !== WALL_TYPE.WALL) {
                            behaviorComponent.targetWall = this.worldMgr.sceneMgr.terrain.findClosestWall(rockyPos)
                        } else if (!components.has(WorldTargetComponent)) {
                            if (targetWall.getDigPositions().some((p) => rockyPos.distanceToSquared(p) <= ROCKY_GATHER_DISTANCE_SQ)) {
                                sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(targetWall.getCenterWorld2D()))
                                this.worldMgr.entityMgr.removeEntity(entity)
                                sceneEntity.setAnimation(RockMonsterActivity.Enter, () => {
                                    GameState.totalCrystals -= behaviorComponent.numCrystalsEaten
                                    EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_MONSTER_GONE, positionComponent))
                                    EventBroker.publish(new UpdateRadarEntityEvent(MapMarkerType.MONSTER, entity, MapMarkerChange.REMOVE))
                                    this.worldMgr.sceneMgr.disposeSceneEntity(sceneEntity)
                                    this.ecs.removeEntity(entity)
                                })
                            } else {
                                const wallPathTargets = targetWall.getDigPositions().map((p) => PathTarget.fromLocation(p, ROCKY_GATHER_DISTANCE_SQ))
                                const path = pathFinder.findShortestPath(rockyPos, wallPathTargets, stats, 1)
                                if (path && path.locations.length > 0) {
                                    const targetLocation = path.locations[0]
                                    this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation, ROCKY_GATHER_DISTANCE_SQ))
                                    this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
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
        } else if (behaviorComponent.numCrystalsEaten < stats.capacity && crystals.length > 0) {
            const closestCrystal = pathFinder.findClosestObj(rockyPos, crystals, stats, 1)
            if (closestCrystal) {
                behaviorComponent.state = RockMonsterBehaviorState.GOTO_CRYSTAL
                behaviorComponent.targetCrystal = closestCrystal.obj
            } else {
                behaviorComponent.state = PRNG.movement.random() < 0.2 ? RockMonsterBehaviorState.BOULDER_ATTACK : RockMonsterBehaviorState.MELEE_ATTACK
            }
        } else if (GameState.monsterCongregation && GameState.monsterCongregation.distanceToSquared(rockyPos) > TILESIZE) {
            const path = pathFinder.findShortestPath(rockyPos, [PathTarget.fromLocation(GameState.monsterCongregation)], stats, 1)
            if (path && path.locations.length > 0) {
                const targetLocation = path.locations[0]
                this.ecs.addComponent(entity, new WorldTargetComponent(targetLocation, 1))
                this.ecs.addComponent(entity, new HeadingComponent(targetLocation))
                return
            }
        } else {
            behaviorComponent.state = PRNG.movement.random() < 0.2 ? RockMonsterBehaviorState.BOULDER_ATTACK : RockMonsterBehaviorState.MELEE_ATTACK
        }
    }

    private punchVehicle(behaviorComponent: RockMonsterBehaviorComponent, entity: number, sceneEntity: AnimatedSceneEntity, vehicleInMeleeRange: VehicleTarget, rockyPos: Vector2, stats: MonsterEntityStats) {
        const prevState = behaviorComponent.state
        this.ecs.removeComponent(entity, WorldTargetComponent)
        this.ecs.removeComponent(entity, HeadingComponent)
        sceneEntity.lookAt(this.worldMgr.sceneMgr.getFloorPosition(vehicleInMeleeRange.position.getPosition2D()))
        behaviorComponent.state = RockMonsterBehaviorState.PUNCH
        sceneEntity.setAnimation(RockMonsterActivity.Punch, () => {
            sceneEntity.setAnimation(AnimEntityActivity.Stand)
            behaviorComponent.state = prevState
        }, 0, () => {
            if (vehicleInMeleeRange.position.getPosition2D().distanceToSquared(rockyPos) < ROCKY_MELEE_ATTACK_DISTANCE_SQ) {
                const vehicleComponents = this.ecs.getComponents(vehicleInMeleeRange.entity)
                const healthComponent = vehicleComponents.get(HealthComponent)
                healthComponent.changeHealth(stats.repairValue)
                if (healthComponent.triggerAlarm) EventBroker.publish(new WorldLocationEvent(EventKey.LOCATION_UNDER_ATTACK, vehicleComponents.get(PositionComponent)))
            }
        })
    }

    private throwRaider(behaviorComponent: RockMonsterBehaviorComponent, entity: GameEntity, sceneEntity: AnimatedSceneEntity, raider: Raider, positionComponent: PositionComponent) {
        const prevState = behaviorComponent.state
        this.ecs.removeComponent(entity, WorldTargetComponent)
        this.ecs.removeComponent(entity, HeadingComponent)
        behaviorComponent.state = RockMonsterBehaviorState.THROW_MAN
        const prevScale = raider.sceneEntity.getWorldScale(new Vector3())
        sceneEntity.setAnimation(RockMonsterActivity.ThrowMan, () => {
            raider.sceneEntity.getWorldPosition(raider.sceneEntity.position)
            raider.sceneEntity.rotation.copy(sceneEntity.rotation)
            const raiderPositionComponent = this.ecs.getComponents(raider.entity).get(PositionComponent)
            raiderPositionComponent.position.copy(raider.sceneEntity.position)
            raiderPositionComponent.surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(raiderPositionComponent.position)
            raiderPositionComponent.markDirty()
            sceneEntity.depositParent?.remove(raider.sceneEntity)
            this.worldMgr.sceneMgr.addSceneEntity(raider.sceneEntity)
            raider.sceneEntity.scale.copy(prevScale)
            sceneEntity.setAnimation(AnimEntityActivity.Stand)
            behaviorComponent.state = prevState
            sceneEntity.position.add(new Vector3(0, 0, TILESIZE / 2).applyEuler(sceneEntity.rotation))
            positionComponent.position.copy(sceneEntity.position)
            positionComponent.surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(positionComponent.position)
            positionComponent.markDirty()
        })
        raider.thrown = true
        raider.dropCarried(true)
        raider.stopJob()
        raider.sceneEntity.setAnimation(RaiderActivity.Thrown, () => {
            raider.sceneEntity.setAnimation(RaiderActivity.GetUp, () => {
                raider.thrown = false
                raider.sceneEntity.setAnimation(AnimEntityActivity.Stand)
            })
        })
        raider.sceneEntity.position.copy(new Vector3(0, 0, 4)) // XXX Why is this offset needed?
        raider.sceneEntity.rotation.copy(new Euler(0, Math.PI, 0)) // XXX Why is this rotation needed?
        sceneEntity.depositParent?.add(raider.sceneEntity)
        const parentScale = new Vector3(1, 1, 1)
        raider.sceneEntity.parent?.getWorldScale(parentScale)
        raider.sceneEntity.scale.set(1 / parentScale.x, 1 / parentScale.y, 1 / parentScale.z)
    }
}
