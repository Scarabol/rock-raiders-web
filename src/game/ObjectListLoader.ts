import { MathUtils, Vector2 } from 'three'
import { ObjectListEntryCfg } from '../cfg/ObjectListEntryCfg'
import { EventBus } from '../event/EventBus'
import { RaidersChangedEvent } from '../event/LocalEvents'
import { TILESIZE } from '../params'
import { EntityManager } from './EntityManager'
import { RockMonsterActivity } from './model/activities/RockMonsterActivity'
import { BuildingFactory } from './model/building/BuildingFactory'
import { EntityType, getEntityTypeByName } from './model/EntityType'
import { Crystal } from './model/material/Crystal'
import { Bat } from './model/monster/Bat'
import { IceMonster } from './model/monster/IceMonster'
import { LavaMonster } from './model/monster/LavaMonster'
import { RockMonster } from './model/monster/RockMonster'
import { SmallSpider } from './model/monster/SmallSpider'
import { Raider } from './model/raider/Raider'
import { VehicleEntity } from './model/vehicle/VehicleEntity'
import { VehicleFactory } from './model/vehicle/VehicleFactory'
import { SceneManager } from './SceneManager'
import degToRad = MathUtils.degToRad

export class ObjectListLoader {

    static loadObjectList(objectList: Map<string, ObjectListEntryCfg>, disableStartTeleport: boolean, sceneMgr: SceneManager, entityMgr: EntityManager) {
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
                    const raider = new Raider(sceneMgr, entityMgr)
                    raider.sceneEntity.changeActivity()
                    raider.sceneEntity.makeSelectable(raider)
                    raider.sceneEntity.addToScene(worldPos, radHeading - Math.PI / 2)
                    if (raider.sceneEntity.visible) {
                        entityMgr.raiders.push(raider)
                        EventBus.publishEvent(new RaidersChangedEvent(entityMgr))
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
                    const entity = BuildingFactory.createBuildingFromType(entityType, sceneMgr, entityMgr)
                    entity.placeDown(worldPos, -radHeading - Math.PI, disableStartTeleport)
                    break
                case EntityType.CRYSTAL:
                    entityMgr.placeMaterial(new Crystal(sceneMgr, entityMgr), worldPos)
                    break
                case EntityType.SMALL_SPIDER:
                    const spider = new SmallSpider(sceneMgr, entityMgr)
                    spider.sceneEntity.changeActivity()
                    spider.sceneEntity.addToScene(worldPos, radHeading)
                    entityMgr.spiders.push(spider)
                    break
                case EntityType.BAT:
                    const bat = new Bat(sceneMgr, entityMgr)
                    bat.sceneEntity.changeActivity()
                    bat.sceneEntity.addToScene(worldPos, radHeading)
                    entityMgr.bats.push(bat)
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
                    const vehicle = VehicleFactory.createVehicleFromType(entityType, sceneMgr, entityMgr)
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
                case EntityType.ICE_MONSTER:
                    const iceMonster = new IceMonster(sceneMgr, entityMgr)
                    iceMonster.sceneEntity.changeActivity(RockMonsterActivity.Unpowered)
                    iceMonster.sceneEntity.addToScene(worldPos, radHeading - Math.PI / 2)
                    if (iceMonster.sceneEntity.visible) {
                        entityMgr.rockMonsters.push(iceMonster)
                    } else {
                        entityMgr.undiscoveredRockMonsters.push(iceMonster)
                    }
                    break
                case EntityType.LAVA_MONSTER:
                    const lavaMonster = new LavaMonster(sceneMgr, entityMgr)
                    lavaMonster.sceneEntity.changeActivity(RockMonsterActivity.Unpowered)
                    lavaMonster.sceneEntity.addToScene(worldPos, radHeading - Math.PI / 2)
                    if (lavaMonster.sceneEntity.visible) {
                        entityMgr.rockMonsters.push(lavaMonster)
                    } else {
                        entityMgr.undiscoveredRockMonsters.push(lavaMonster)
                    }
                    break
                case EntityType.ROCK_MONSTER:
                    const rockMonster = new RockMonster(sceneMgr, entityMgr)
                    rockMonster.sceneEntity.changeActivity(RockMonsterActivity.Unpowered)
                    rockMonster.sceneEntity.addToScene(worldPos, radHeading - Math.PI / 2)
                    if (rockMonster.sceneEntity.visible) {
                        entityMgr.rockMonsters.push(rockMonster)
                    } else {
                        entityMgr.undiscoveredRockMonsters.push(rockMonster)
                    }
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
