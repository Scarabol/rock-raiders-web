import { MathUtils, Vector2 } from 'three'
import { ObjectListEntryCfg } from '../cfg/ObjectListEntryCfg'
import { EventBus } from '../event/EventBus'
import { RaidersAmountChangedEvent } from '../event/LocalEvents'
import { TILESIZE } from '../params'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingType } from './model/building/BuildingType'
import { EntityType, getEntityTypeByName, VehicleEntityType } from './model/EntityType'
import { Raider } from './model/raider/Raider'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { VehicleFactory } from './model/vehicle/VehicleFactory'
import { WorldManager } from './WorldManager'
import { MonsterSpawner } from './entity/MonsterSpawner'
import { SceneSelectionComponent } from './component/SceneSelectionComponent'
import { SelectionFrameComponent } from './component/SelectionFrameComponent'
import { MaterialSpawner } from './entity/MaterialSpawner'
import { AnimEntityActivity, RaiderActivity } from './model/anim/AnimationActivity'
import { PositionComponent } from './component/PositionComponent'
import { RaiderTrainings } from './model/raider/RaiderTraining'
import degToRad = MathUtils.degToRad

export class ObjectListLoader {
    static numRaider: number = 0
    static startVehicle: string = ''

    readonly vehicleKeyToDriver = new Map<string, Raider>()
    readonly vehicleByKey = new Map<string, VehicleEntity>()

    constructor(readonly worldMgr: WorldManager, readonly disableStartTeleport: boolean) {
    }

    loadObjectList(objectList: Map<string, ObjectListEntryCfg>) {
        try {
            objectList.forEach((olEntry, olKey) => {
                try {
                    this.loadObjectEntry(olEntry, olKey)
                } catch (e) {
                    console.error(e)
                }
            })
            EventBus.publishEvent(new RaidersAmountChangedEvent(this.worldMgr.entityMgr))
            this.vehicleKeyToDriver.forEach((driver, vehicleKey) => {
                const vehicle = this.vehicleByKey.get(vehicleKey)
                if (!vehicle) {
                    console.error(`Could not find vehicle for driver ${driver}`)
                    return
                }
                driver.addTraining(vehicle.getRequiredTraining())
                vehicle.addDriver(driver)
            })
        } catch (e) {
            console.error(e)
        }
    }

    private loadObjectEntry(olEntry: ObjectListEntryCfg, olKey: string) {
        const entityType = getEntityTypeByName(olEntry.type ? olEntry.type.toLowerCase() : olEntry.type)
        // all object positions are off by one tile, because they start at 1 not 0
        const worldPos = new Vector2(olEntry.xPos, olEntry.yPos).addScalar(-1).multiplyScalar(TILESIZE) // TODO assert that world pos is over terrain otherwise drop item
        const headingRad = degToRad(olEntry.heading)
        switch (entityType) {
            case EntityType.TV_CAMERA:
                const cameraOffset = new Vector2(6, 0).rotateAround(new Vector2(0, 0), headingRad + Math.PI / 2)
                const cameraPos = this.worldMgr.sceneMgr.getFloorPosition(cameraOffset.multiplyScalar(TILESIZE).add(worldPos))
                cameraPos.y += 4 * TILESIZE
                this.worldMgr.sceneMgr.camera.position.copy(cameraPos)
                this.worldMgr.sceneMgr.controls.target.copy(this.worldMgr.sceneMgr.getFloorPosition(worldPos))
                this.worldMgr.sceneMgr.controls.update()
                this.worldMgr.sceneMgr.setCursorFloorPosition(new Vector2(worldPos.x, worldPos.y - TILESIZE / 2))
                break
            case EntityType.PILOT:
                const raider = this.spawnRaider(worldPos, headingRad)
                if (olEntry.driving) this.vehicleKeyToDriver.set(olEntry.driving, raider)
                this.worldMgr.entityMgr.recordedEntities.push(raider.entity)
                break
            case EntityType.TOOLSTATION:
            case EntityType.TELEPORT_PAD:
            case EntityType.DOCKS:
            case EntityType.POWER_STATION:
            case EntityType.BARRACKS:
            case EntityType.UPGRADE:
            case EntityType.GEODOME:
            case EntityType.ORE_REFINERY:
            case EntityType.GUNSTATION:
            case EntityType.TELEPORT_BIG:
                const buildingType = BuildingType.from(entityType)
                const entity = new BuildingEntity(this.worldMgr, buildingType)
                entity.placeDown(worldPos, -headingRad - Math.PI, this.disableStartTeleport)
                if (entityType === EntityType.TOOLSTATION) {
                    for (let c = 0; c < ObjectListLoader.numRaider; c++) {
                        const randomPosition = entity.primaryPathSurface.getRandomPosition()
                        const raider = this.spawnRaider(randomPosition, headingRad - Math.PI)
                        RaiderTrainings.values.forEach((t) => raider.addTraining(t))
                    }
                    if (ObjectListLoader.startVehicle) {
                        const startVehicleEntityType = getEntityTypeByName(ObjectListLoader.startVehicle) as VehicleEntityType
                        if (startVehicleEntityType) {
                            this.spawnVehicle(startVehicleEntityType, entity.primaryPathSurface.getCenterWorld2D(), headingRad - Math.PI)
                        } else {
                            console.warn(`Could not determine entity type for '${ObjectListLoader.startVehicle}'`)
                        }
                    }
                }
                break
            case EntityType.CRYSTAL:
            case EntityType.ORE:
            case EntityType.BRICK:
                MaterialSpawner.spawnMaterial(this.worldMgr, entityType, worldPos, headingRad)
                break
            case EntityType.SMALL_SPIDER:
            case EntityType.BAT:
            case EntityType.ICE_MONSTER:
            case EntityType.LAVA_MONSTER:
            case EntityType.ROCK_MONSTER:
                MonsterSpawner.spawnMonster(this.worldMgr, entityType, worldPos, headingRad - Math.PI / 2)
                break
            case EntityType.HOVERBOARD:
            case EntityType.SMALL_DIGGER:
            case EntityType.SMALL_TRUCK:
            case EntityType.SMALL_CAT:
            case EntityType.SMALL_MLP:
            case EntityType.SMALL_HELI:
            case EntityType.BULLDOZER:
            case EntityType.WALKER_DIGGER:
            case EntityType.LARGE_MLP:
            case EntityType.LARGE_DIGGER:
            case EntityType.LARGE_CAT:
            case EntityType.LARGE_HELI:
                const vehicle = this.spawnVehicle(entityType, worldPos, headingRad)
                this.vehicleByKey.set(olKey, vehicle)
                this.worldMgr.entityMgr.recordedEntities.push(vehicle.entity)
                break
            default:
                console.warn(`Object type ${olEntry.type} not yet implemented`)
                break
        }
    }

    private spawnRaider(worldPos: Vector2, headingRad: number) {
        const raider = new Raider(this.worldMgr)
        raider.sceneEntity.setAnimation(RaiderActivity.Stand)
        const raiderSceneSelection = this.worldMgr.ecs.addComponent(raider.entity, new SceneSelectionComponent(raider.sceneEntity, {gameEntity: raider.entity, entityType: raider.entityType}, raider.stats))
        this.worldMgr.ecs.addComponent(raider.entity, new SelectionFrameComponent(raiderSceneSelection.pickSphere, raider.stats))
        const floorPosition = this.worldMgr.sceneMgr.getFloorPosition(worldPos)
        raider.sceneEntity.position.copy(floorPosition)
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(floorPosition)
        this.worldMgr.ecs.addComponent(raider.entity, new PositionComponent(floorPosition, surface))
        raider.sceneEntity.rotation.y = headingRad - Math.PI / 2
        raider.sceneEntity.visible = surface.discovered
        this.worldMgr.sceneMgr.addMeshGroup(raider.sceneEntity)
        if (raider.sceneEntity.visible) {
            this.worldMgr.entityMgr.raiders.push(raider)
        } else {
            this.worldMgr.entityMgr.raidersUndiscovered.push(raider)
        }
        return raider
    }

    private spawnVehicle(entityType: VehicleEntityType, worldPos: Vector2, headingRad: number) {
        const vehicle = VehicleFactory.createVehicleFromType(entityType, this.worldMgr)
        vehicle.sceneEntity.setAnimation(AnimEntityActivity.Stand)
        const vehicleSceneSelection = this.worldMgr.ecs.addComponent(vehicle.entity, new SceneSelectionComponent(vehicle.sceneEntity, {gameEntity: vehicle.entity, entityType: vehicle.entityType}, vehicle.stats))
        this.worldMgr.ecs.addComponent(vehicle.entity, new SelectionFrameComponent(vehicleSceneSelection.pickSphere, vehicle.stats))
        const floorPosition = this.worldMgr.sceneMgr.getFloorPosition(worldPos)
        vehicle.sceneEntity.position.copy(floorPosition)
        const surface = this.worldMgr.sceneMgr.terrain.getSurfaceFromWorld(floorPosition)
        this.worldMgr.ecs.addComponent(vehicle.entity, new PositionComponent(floorPosition, surface))
        vehicle.sceneEntity.rotation.y = headingRad + Math.PI
        vehicle.sceneEntity.visible = surface.discovered
        this.worldMgr.sceneMgr.addMeshGroup(vehicle.sceneEntity)
        if (vehicle.sceneEntity.visible) {
            this.worldMgr.entityMgr.vehicles.push(vehicle)
        } else {
            this.worldMgr.entityMgr.vehiclesUndiscovered.push(vehicle)
        }
        return vehicle
    }
}
