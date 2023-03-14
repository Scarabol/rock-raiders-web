import { MathUtils, Vector2 } from 'three'
import { ObjectListEntryCfg } from '../cfg/ObjectListEntryCfg'
import { EventBus } from '../event/EventBus'
import { RaidersAmountChangedEvent } from '../event/LocalEvents'
import { TILESIZE } from '../params'
import { AnimatedSceneEntityComponent } from './component/common/AnimatedSceneEntityComponent'
import { PositionComponent } from './component/common/PositionComponent'
import { MonsterSpawner } from './entity/MonsterSpawner'
import { RockMonsterActivity } from './model/anim/AnimationActivity'
import { BuildingEntity } from './model/building/BuildingEntity'
import { BuildingType } from './model/building/BuildingType'
import { EntityType, getEntityTypeByName } from './model/EntityType'
import { Crystal } from './model/material/Crystal'
import { Raider } from './model/raider/Raider'
import { RaiderTrainings } from './model/raider/RaiderTraining'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { VehicleFactory } from './model/vehicle/VehicleFactory'
import { WorldManager } from './WorldManager'
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
            const radHeading = degToRad(olEntry.heading)
            switch (entityType) {
                case EntityType.TV_CAMERA:
                    const cameraOffset = new Vector2(6, 0).rotateAround(new Vector2(0, 0), radHeading + Math.PI / 2)
                    const cameraPos = sceneMgr.getFloorPosition(cameraOffset.multiplyScalar(TILESIZE).add(worldPos))
                    cameraPos.y += 4 * TILESIZE
                    sceneMgr.camera.position.copy(cameraPos)
                    sceneMgr.controls.target.copy(sceneMgr.getFloorPosition(worldPos))
                    sceneMgr.controls.update()
                    sceneMgr.setTorchPosition(new Vector2(worldPos.x, worldPos.y - TILESIZE / 2))
                    break
                case EntityType.PILOT:
                    const raider = new Raider(worldMgr)
                    raider.sceneEntity.changeActivity()
                    raider.sceneEntity.makeSelectable(raider)
                    raider.sceneEntity.addToScene(worldPos, radHeading - Math.PI / 2)
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
                    entity.placeDown(worldPos, -radHeading - Math.PI, disableStartTeleport)
                    if (entityType === EntityType.TOOLSTATION) {
                        for (let c = 0; c < this.numRaider; c++) {
                            const raider = new Raider(worldMgr)
                            raider.sceneEntity.changeActivity()
                            raider.sceneEntity.makeSelectable(raider)
                            raider.sceneEntity.addToScene(entity.primaryPathSurface.getRandomPosition(), radHeading - Math.PI)
                            RaiderTrainings.values.forEach((t) => raider.addTraining(t))
                            entityMgr.raiders.push(raider)
                            EventBus.publishEvent(new RaidersAmountChangedEvent(entityMgr))
                        }
                    }
                    break
                case EntityType.CRYSTAL:
                    entityMgr.placeMaterial(new Crystal(worldMgr), worldPos)
                    break
                case EntityType.SMALL_SPIDER:
                case EntityType.BAT:
                case EntityType.ICE_MONSTER:
                case EntityType.LAVA_MONSTER:
                case EntityType.ROCK_MONSTER:
                    const monster = MonsterSpawner.createMonster(entityType, worldMgr)
                    monster.getComponent(PositionComponent).setPosition2D(worldPos)
                    const sceneEntity = monster.getComponent(AnimatedSceneEntityComponent)
                    sceneEntity.changeActivity(RockMonsterActivity.Unpowered)
                    sceneEntity.addToScene(worldPos, radHeading - Math.PI / 2)
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
                    vehicle.sceneEntity.makeSelectable(vehicle)
                    vehicle.sceneEntity.addToScene(worldPos, radHeading + Math.PI)
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
