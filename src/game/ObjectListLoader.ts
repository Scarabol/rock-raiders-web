import { MathUtils, Vector2 } from 'three'
import { ObjectListEntryCfg } from '../cfg/ObjectListEntryCfg'
import { EventBus } from '../event/EventBus'
import { RaidersAmountChangedEvent } from '../event/LocalEvents'
import { TILESIZE } from '../params'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingType } from './model/building/BuildingType'
import { EntityType, getEntityTypeByName } from './model/EntityType'
import { Crystal } from './model/material/Crystal'
import { Raider } from './model/raider/Raider'
import { RaiderTrainings } from './model/raider/RaiderTraining'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { VehicleFactory } from './model/vehicle/VehicleFactory'
import { WorldManager } from './WorldManager'
import { Ore } from './model/material/Ore'
import { Brick } from './model/material/Brick'
import { MonsterSpawner } from './entity/MonsterSpawner'
import { SceneSelectionComponent } from './component/SceneSelectionComponent'
import { SelectionFrameComponent } from './component/SelectionFrameComponent'
import degToRad = MathUtils.degToRad

export class ObjectListLoader {
    static numRaider: number = 0

    static loadObjectList(objectList: Map<string, ObjectListEntryCfg>, disableStartTeleport: boolean, worldMgr: WorldManager) {
        const sceneMgr = worldMgr.sceneMgr
        const entityMgr = worldMgr.entityMgr
        const vehicleKeyToDriver = new Map<string, Raider>()
        const vehicleByKey = new Map<string, VehicleEntity>()
        objectList.forEach((olEntry, olKey) => {
            const entityType = getEntityTypeByName(olEntry.type ? olEntry.type.toLowerCase() : olEntry.type)
            // all object positions are off by one tile, because they start at 1 not 0
            const worldPos = new Vector2(olEntry.xPos, olEntry.yPos).addScalar(-1).multiplyScalar(TILESIZE) // TODO assert that world pos is over terrain otherwise drop item
            const headingRad = degToRad(olEntry.heading)
            switch (entityType) {
                case EntityType.TV_CAMERA:
                    const cameraOffset = new Vector2(6, 0).rotateAround(new Vector2(0, 0), headingRad + Math.PI / 2)
                    const cameraPos = sceneMgr.getFloorPosition(cameraOffset.multiplyScalar(TILESIZE).add(worldPos))
                    cameraPos.y += 4 * TILESIZE
                    sceneMgr.camera.position.copy(cameraPos)
                    sceneMgr.controls.target.copy(sceneMgr.getFloorPosition(worldPos))
                    sceneMgr.controls.update()
                    sceneMgr.setCursorFloorPosition(new Vector2(worldPos.x, worldPos.y - TILESIZE / 2))
                    break
                case EntityType.PILOT:
                    const raider = new Raider(worldMgr)
                    raider.sceneEntity.changeActivity()
                    const raiderSceneSelection = worldMgr.ecs.addComponent(raider.entity, new SceneSelectionComponent(raider.sceneEntity.group, {gameEntity: raider.entity, entityType: raider.entityType}, raider.stats))
                    worldMgr.ecs.addComponent(raider.entity, new SelectionFrameComponent(raiderSceneSelection.pickSphere, raider.stats))
                    raider.sceneEntity.addToScene(worldPos, headingRad - Math.PI / 2)
                    if (raider.sceneEntity.visible) {
                        entityMgr.raiders.push(raider)
                        EventBus.publishEvent(new RaidersAmountChangedEvent(entityMgr))
                    } else {
                        entityMgr.raidersUndiscovered.push(raider)
                    }
                    if (olEntry.driving) vehicleKeyToDriver.set(olEntry.driving, raider)
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
                    const entity = new BuildingEntity(worldMgr, buildingType)
                    entity.placeDown(worldPos, -headingRad - Math.PI, disableStartTeleport)
                    if (entityType === EntityType.TOOLSTATION) {
                        for (let c = 0; c < this.numRaider; c++) {
                            const raider = new Raider(worldMgr)
                            raider.sceneEntity.changeActivity()
                            const sceneSelectionComponent = worldMgr.ecs.addComponent(raider.entity, new SceneSelectionComponent(raider.sceneEntity.group, {gameEntity: raider.entity, entityType: raider.entityType}, raider.stats))
                            worldMgr.ecs.addComponent(raider.entity, new SelectionFrameComponent(sceneSelectionComponent.pickSphere, raider.stats))
                            raider.sceneEntity.addToScene(entity.primaryPathSurface.getRandomPosition(), headingRad - Math.PI)
                            RaiderTrainings.values.forEach((t) => raider.addTraining(t))
                            entityMgr.raiders.push(raider)
                            EventBus.publishEvent(new RaidersAmountChangedEvent(entityMgr))
                        }
                    }
                    break
                case EntityType.CRYSTAL:
                    entityMgr.placeMaterial(new Crystal(worldMgr), worldPos)
                    break
                case EntityType.ORE:
                    entityMgr.placeMaterial(new Ore(worldMgr), worldPos)
                    break
                case EntityType.BRICK:
                    entityMgr.placeMaterial(new Brick(worldMgr), worldPos)
                    break
                case EntityType.SMALL_SPIDER:
                case EntityType.BAT:
                case EntityType.ICE_MONSTER:
                case EntityType.LAVA_MONSTER:
                case EntityType.ROCK_MONSTER:
                    MonsterSpawner.spawnMonster(worldMgr, entityType, worldPos, headingRad - Math.PI / 2)
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
                    const vehicle = VehicleFactory.createVehicleFromType(entityType, worldMgr)
                    vehicle.sceneEntity.changeActivity()
                    const vehicleSceneSelection = worldMgr.ecs.addComponent(vehicle.entity, new SceneSelectionComponent(vehicle.sceneEntity.group, {gameEntity: vehicle.entity, entityType: vehicle.entityType}, vehicle.stats))
                    worldMgr.ecs.addComponent(vehicle.entity, new SelectionFrameComponent(vehicleSceneSelection.pickSphere, vehicle.stats))
                    vehicle.sceneEntity.addToScene(worldPos, headingRad + Math.PI)
                    if (vehicle.sceneEntity.visible) {
                        entityMgr.vehicles.push(vehicle)
                    } else {
                        entityMgr.vehiclesUndiscovered.push(vehicle)
                    }
                    vehicleByKey.set(olKey, vehicle)
                    break
                default:
                    console.warn(`Object type ${olEntry.type} not yet implemented`)
                    break
            }
        })
        vehicleKeyToDriver.forEach((driver, vehicleKey) => {
            const vehicle = vehicleByKey.get(vehicleKey)
            if (!vehicle) {
                console.error(`Could not find vehicle for driver ${driver}`)
                return
            }
            driver.addTraining(vehicle.getRequiredTraining())
            vehicle.addDriver(driver)
        })
    }
}
