import { AbstractGameSystem, ECS, GameEntity } from '../ECS'
import { EventBroker } from '../../event/EventBroker'
import { EventKey } from '../../event/EventKeyEnum'
import { GameResultEvent, LevelSelectedEvent, MaterialAmountChanged, RequestedRaidersChanged, RequestedVehiclesChanged } from '../../event/WorldEvents'
import { EntityType } from '../model/EntityType'
import { TeleportComponent } from '../component/TeleportComponent'
import { CHECK_SPAWN_RAIDER_TIMER, CHECK_SPAWN_VEHICLE_TIMER, TILESIZE } from '../../params'
import { Raider } from '../model/raider/Raider'
import { Vector2 } from 'three'
import { VehicleFactory } from '../model/vehicle/VehicleFactory'
import { GameState } from '../model/GameState'
import { PositionComponent } from '../component/PositionComponent'
import { ANIM_ENTITY_ACTIVITY } from '../model/anim/AnimationActivity'
import { HealthComponent } from '../component/HealthComponent'
import { GameConfig } from '../../cfg/GameConfig'
import { OxygenComponent } from '../component/OxygenComponent'
import { RaiderInfoComponent } from '../component/RaiderInfoComponent'
import { SceneSelectionComponent } from '../component/SceneSelectionComponent'
import { SelectionFrameComponent } from '../component/SelectionFrameComponent'
import { MoveJob } from '../model/job/MoveJob'
import { BuildingsChangedEvent, RaidersAmountChangedEvent, UpdateRadarEntityEvent } from '../../event/LocalEvents'
import { MAP_MARKER_CHANGE, MAP_MARKER_TYPE, MapMarkerComponent } from '../component/MapMarkerComponent'
import { WorldManager } from '../WorldManager'
import { GAME_RESULT_STATE, GameResultState } from '../model/GameResult'
import { PRNG } from '../factory/PRNG'

export class TeleportSystem extends AbstractGameSystem {
    readonly componentsRequired: Set<Function> = new Set([TeleportComponent])
    requestedRaiders: number = 0
    spawnRaiderTimer: number = 0
    requestedVehicleTypes: EntityType[] = []
    spawnVehicleTimer: number = 0
    poweredBuildings: Set<GameEntity> = new Set()
    disableEndTeleport: boolean = false
    gameState: GameResultState = GAME_RESULT_STATE.undecided

    constructor(readonly worldMgr: WorldManager) {
        super()
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, (event: LevelSelectedEvent) => {
            this.requestedRaiders = 0
            this.spawnRaiderTimer = 0
            this.requestedVehicleTypes.length = 0
            this.spawnVehicleTimer = 0
            this.poweredBuildings?.clear()
            this.disableEndTeleport = event.levelConf.disableEndTeleport
            this.gameState = GAME_RESULT_STATE.undecided
        })
        EventBroker.subscribe(EventKey.REQUESTED_RAIDERS_CHANGED, (event: RequestedRaidersChanged) => {
            this.requestedRaiders = event.numRequested
        })
        EventBroker.subscribe(EventKey.REQUESTED_VEHICLES_CHANGED, (event: RequestedVehiclesChanged) => {
            const requestedChange = event.numRequested - this.requestedVehicleTypes.count((e) => e === event.vehicle)
            for (let c = 0; c < -requestedChange; c++) {
                this.requestedVehicleTypes.removeLast(event.vehicle)
            }
            for (let c = 0; c < requestedChange; c++) {
                this.requestedVehicleTypes.push(event.vehicle)
            }
        })
        EventBroker.subscribe(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.poweredBuildings = event.poweredBuildings
        })
        EventBroker.subscribe(EventKey.GAME_RESULT_STATE, (event: GameResultEvent) => {
            this.gameState = event.result
        })
    }

    update(ecs: ECS, elapsedMs: number, entities: Set<GameEntity>, _dirty: Set<GameEntity>): void {
        const teleports: TeleportComponent[] = []
        entities.forEach((e) => {
            if (this.poweredBuildings.has(e)) teleports.add(ecs.getComponents(e).get(TeleportComponent))
        })
        try {
            for (this.spawnRaiderTimer += elapsedMs; this.spawnRaiderTimer >= CHECK_SPAWN_RAIDER_TIMER; this.spawnRaiderTimer -= CHECK_SPAWN_RAIDER_TIMER) {
                if (this.requestedRaiders > 0 && !this.worldMgr.entityMgr.hasMaxRaiders()) {
                    const teleport = teleports.find((t) => t.canTeleportIn(EntityType.PILOT))
                    if (!teleport) break
                    this.requestedRaiders--
                    EventBroker.publish(new RequestedRaidersChanged(this.requestedRaiders))
                    const raider = new Raider(this.worldMgr, true)
                    const heading = teleport.heading
                    const worldPosition = new Vector2(0, -TILESIZE / 2).rotateAround(new Vector2(0, 0), -heading).add(teleport.primaryPathSurface.getCenterWorld2D())
                    const walkOutPos = teleport.primaryPathSurface.getRandomPosition()
                    teleport.operating = true
                    const floorPosition = this.worldMgr.sceneMgr.getFloorPosition(worldPosition)
                    const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(floorPosition)
                    const positionComponent = ecs.addComponent(raider.entity, new PositionComponent(floorPosition, surface))
                    raider.sceneEntity.position.copy(floorPosition)
                    raider.sceneEntity.position.y += positionComponent.floorOffset
                    raider.sceneEntity.rotation.y = heading
                    raider.sceneEntity.visible = surface.discovered
                    this.worldMgr.sceneMgr.addSceneEntity(raider.sceneEntity)
                    raider.sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.teleportIn, () => {
                        raider.sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.stand)
                        if (this.gameState !== GAME_RESULT_STATE.undecided) {
                            if (!this.disableEndTeleport) setTimeout(() => raider.beamUp(), PRNG.animation.randInt(3000))
                            return // no need to set up raider after game ended
                        }
                        let healthComponent: HealthComponent
                        if (raider.entityType === EntityType.PILOT) {
                            healthComponent = ecs.addComponent(raider.entity, new HealthComponent(false, 16, 10, raider.sceneEntity, true, GameConfig.instance.getRockFallDamage(raider.entityType, raider.level)))
                            ecs.addComponent(raider.entity, new OxygenComponent(raider.stats.oxygenCoef))
                            const infoComp = ecs.addComponent(raider.entity, new RaiderInfoComponent(raider.sceneEntity))
                            this.worldMgr.sceneMgr.addSprite(infoComp.bubbleSprite)
                            infoComp.setHungerIndicator((raider as Raider).foodLevel)
                        } else {
                            healthComponent = ecs.addComponent(raider.entity, new HealthComponent(false, 24, 14, raider.sceneEntity, false, GameConfig.instance.getRockFallDamage(raider.entityType, raider.level)))
                        }
                        this.worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
                        this.worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
                        const sceneSelectionComponent = ecs.addComponent(raider.entity, new SceneSelectionComponent(raider.sceneEntity, {gameEntity: raider.entity, entityType: raider.entityType}, raider.stats))
                        ecs.addComponent(raider.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, raider.stats))
                        if (walkOutPos) raider.setJob(new MoveJob(walkOutPos))
                        this.worldMgr.entityMgr.raidersInBeam.remove(raider)
                        this.worldMgr.entityMgr.raiders.push(raider)
                        EventBroker.publish(new RaidersAmountChangedEvent(this.worldMgr.entityMgr))
                        ecs.addComponent(raider.entity, new MapMarkerComponent(MAP_MARKER_TYPE.default))
                        EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.default, raider.entity, MAP_MARKER_CHANGE.update, floorPosition))
                        teleport.operating = false
                    })
                    this.worldMgr.entityMgr.raidersInBeam.push(raider)
                }
            }
        } catch (e) {
            console.error(e)
        }
        try {
            for (this.spawnVehicleTimer += elapsedMs; this.spawnVehicleTimer >= CHECK_SPAWN_VEHICLE_TIMER; this.spawnVehicleTimer -= CHECK_SPAWN_VEHICLE_TIMER) {
                if (this.requestedVehicleTypes.length > 0) {
                    const spawnedVehicleType = this.requestedVehicleTypes.find((vType) => {
                        const stats = VehicleFactory.getVehicleStatsByType(vType)
                        if (GameState.numCrystal < stats.costCrystal) return false
                        const teleportBuilding = teleports.find((t) => t.canTeleportIn(vType))
                        if (!teleportBuilding) return false
                        GameState.numCrystal -= stats.costCrystal
                        EventBroker.publish(new MaterialAmountChanged())
                        const vehicle = VehicleFactory.createVehicleFromType(vType, this.worldMgr)
                        const worldPosition = (teleportBuilding.waterPathSurface ?? teleportBuilding.primaryPathSurface).getCenterWorld2D()
                        teleportBuilding.operating = true
                        const floorPosition = vehicle.worldMgr.sceneMgr.getFloorPosition(worldPosition)
                        const surface = vehicle.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(floorPosition)
                        const positionComponent = vehicle.worldMgr.ecs.addComponent(vehicle.entity, new PositionComponent(floorPosition, surface))
                        vehicle.sceneEntity.position.copy(floorPosition)
                        vehicle.sceneEntity.position.y += positionComponent.floorOffset
                        vehicle.sceneEntity.rotation.y = teleportBuilding.heading
                        vehicle.sceneEntity.visible = surface.discovered
                        vehicle.worldMgr.sceneMgr.addSceneEntity(vehicle.sceneEntity)
                        vehicle.sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.teleportIn, () => {
                            vehicle.sceneEntity.setAnimation(ANIM_ENTITY_ACTIVITY.stand)
                            const healthComponent: HealthComponent = vehicle.worldMgr.ecs.addComponent(vehicle.entity, new HealthComponent(false, 24, 14, vehicle.sceneEntity, false, GameConfig.instance.getRockFallDamage(vehicle.entityType, vehicle.level)))
                            vehicle.worldMgr.sceneMgr.addSprite(healthComponent.healthBarSprite)
                            vehicle.worldMgr.sceneMgr.addSprite(healthComponent.healthFontSprite)
                            const sceneSelectionComponent = vehicle.worldMgr.ecs.addComponent(vehicle.entity, new SceneSelectionComponent(vehicle.sceneEntity, {gameEntity: vehicle.entity, entityType: vehicle.entityType}, vehicle.stats))
                            vehicle.worldMgr.ecs.addComponent(vehicle.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, vehicle.stats))
                            this.worldMgr.entityMgr.vehiclesInBeam.remove(vehicle)
                            this.worldMgr.entityMgr.vehicles.push(vehicle)
                            EventBroker.publish(new RaidersAmountChangedEvent(vehicle.worldMgr.entityMgr))
                            vehicle.worldMgr.ecs.addComponent(vehicle.entity, new MapMarkerComponent(MAP_MARKER_TYPE.default))
                            EventBroker.publish(new UpdateRadarEntityEvent(MAP_MARKER_TYPE.default, vehicle.entity, MAP_MARKER_CHANGE.update, floorPosition))
                            teleportBuilding.operating = false
                        })
                        this.worldMgr.entityMgr.vehiclesInBeam.push(vehicle)
                        return true
                    })
                    if (spawnedVehicleType) {
                        this.requestedVehicleTypes.remove(spawnedVehicleType)
                        EventBroker.publish(new RequestedVehiclesChanged(spawnedVehicleType, this.requestedVehicleTypes.count((e) => e === spawnedVehicleType)))
                    }
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
}
