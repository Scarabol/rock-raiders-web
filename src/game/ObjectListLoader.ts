import { MathUtils, Vector2 } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { EventBus } from '../event/EventBus'
import { RaidersChangedEvent } from '../event/LocalEvents'
import { TILESIZE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { EntityManager } from './EntityManager'
import { RockMonsterActivity } from './model/activities/RockMonsterActivity'
import { Barracks } from './model/building/entities/Barracks'
import { Docks } from './model/building/entities/Docks'
import { Geodome } from './model/building/entities/Geodome'
import { GunStation } from './model/building/entities/GunStation'
import { OreRefinery } from './model/building/entities/OreRefinery'
import { PowerStation } from './model/building/entities/PowerStation'
import { TeleportBig } from './model/building/entities/TeleportBig'
import { TeleportPad } from './model/building/entities/TeleportPad'
import { Toolstation } from './model/building/entities/Toolstation'
import { Upgrade } from './model/building/entities/Upgrade'
import { EntityType, getEntityTypeByName } from './model/EntityType'
import { Crystal } from './model/material/Crystal'
import { Bat } from './model/monster/Bat'
import { IceMonster } from './model/monster/IceMonster'
import { LavaMonster } from './model/monster/LavaMonster'
import { RockMonster } from './model/monster/RockMonster'
import { SmallSpider } from './model/monster/SmallSpider'
import { Raider } from './model/raider/Raider'
import { SmallDigger } from './model/vehicle/entities/SmallDigger'
import { SceneManager } from './SceneManager'
import { WorldManager } from './WorldManager'
import degToRad = MathUtils.degToRad

export class ObjectListLoader {

    static loadObjectList(levelConf: LevelEntryCfg, worldMgr: WorldManager, sceneMgr: SceneManager, entityMgr: EntityManager) {
        const objectListConf = ResourceManager.getResource(levelConf.oListFile)
        Object.values(objectListConf).forEach((olObject: any) => {
            const entityType = getEntityTypeByName(olObject.type ? olObject.type.toLowerCase() : olObject.type)
            // all object positions are off by one tile, because they start at 1 not 0
            const worldPos = new Vector2(olObject.xPos, olObject.yPos).addScalar(-1).multiplyScalar(TILESIZE) // TODO assert that world pos is over terrain otherwise drop item
            const buildingType: string = ResourceManager.cfg('BuildingTypes', olObject.type)
            const radHeading = degToRad(olObject.heading)
            if (entityType === EntityType.TV_CAMERA) {
                const cameraOffset = new Vector2(6, 0).rotateAround(new Vector2(0, 0), radHeading + Math.PI / 2)
                const cameraPos = sceneMgr.getFloorPosition(cameraOffset.multiplyScalar(TILESIZE).add(worldPos))
                cameraPos.y += 4 * TILESIZE
                sceneMgr.camera.position.copy(cameraPos)
                sceneMgr.controls.target.copy(sceneMgr.getFloorPosition(worldPos))
                sceneMgr.controls.update()
                sceneMgr.setTorchPosition(new Vector2(worldPos.x, worldPos.y - TILESIZE / 2))
            } else if (entityType === EntityType.PILOT) {
                const raider = new Raider(sceneMgr, entityMgr)
                raider.changeActivity()
                raider.sceneEntity.createPickSphere(raider.stats.PickSphere, raider)
                raider.addToScene(worldPos, radHeading - Math.PI / 2)
                if (raider.sceneEntity.visible) {
                    entityMgr.raiders.push(raider)
                    EventBus.publishEvent(new RaidersChangedEvent(entityMgr))
                } else {
                    entityMgr.raidersUndiscovered.push(raider)
                }
            } else if (buildingType) {
                const entity = this.createBuildingByName(buildingType, sceneMgr, entityMgr)
                entity.placeDown(worldPos, -radHeading - Math.PI, levelConf.disableStartTeleport)
            } else if (entityType === EntityType.CRYSTAL) {
                entityMgr.placeMaterial(new Crystal(sceneMgr, entityMgr), worldPos)
            } else if (entityType === EntityType.SMALL_SPIDER) {
                const spider = new SmallSpider(sceneMgr, entityMgr)
                spider.changeActivity()
                spider.addToScene(worldPos, radHeading)
                entityMgr.spiders.push(spider)
                spider.startMoving()
            } else if (entityType === EntityType.BAT) {
                const bat = new Bat(sceneMgr, entityMgr)
                bat.changeActivity()
                bat.addToScene(worldPos, radHeading)
                entityMgr.bats.push(bat)
                bat.startRandomMove()
            } else if (entityType === EntityType.SMALL_DIGGER) {
                const smallDigger = new SmallDigger(sceneMgr, entityMgr)
                smallDigger.changeActivity()
                smallDigger.sceneEntity.createPickSphere(smallDigger.stats.PickSphere, smallDigger)
                smallDigger.addToScene(worldPos, radHeading + Math.PI)
                if (smallDigger.sceneEntity.visible) {
                    entityMgr.vehicles.push(smallDigger)
                } else {
                    entityMgr.vehiclesUndiscovered.push(smallDigger)
                }
            } else if (entityType === EntityType.ICE_MONSTER) {
                const rockMonster = new IceMonster(sceneMgr, entityMgr)
                rockMonster.changeActivity(RockMonsterActivity.Unpowered)
                rockMonster.addToScene(worldPos, radHeading - Math.PI / 2)
                entityMgr.rockMonsters.push(rockMonster)
            } else if (entityType === EntityType.LAVA_MONSTER) {
                const rockMonster = new LavaMonster(sceneMgr, entityMgr)
                rockMonster.changeActivity(RockMonsterActivity.Unpowered)
                rockMonster.addToScene(worldPos, radHeading - Math.PI / 2)
                entityMgr.rockMonsters.push(rockMonster)
            } else if (entityType === EntityType.ROCK_MONSTER) {
                const rockMonster = new RockMonster(sceneMgr, entityMgr)
                rockMonster.changeActivity(RockMonsterActivity.Unpowered)
                rockMonster.addToScene(worldPos, radHeading - Math.PI / 2)
                entityMgr.rockMonsters.push(rockMonster)
            } else {
                // TODO implement remaining object types
                console.warn('Object type ' + olObject.type + ' not yet implemented')
            }
        })
    }

    private static createBuildingByName(buildingType: string, sceneMgr: SceneManager, entityMgr: EntityManager) {
        const typename = buildingType.slice(buildingType.lastIndexOf('/') + 1).toLowerCase()
        if (typename === 'toolstation') {
            return new Toolstation(sceneMgr, entityMgr)
        } else if (typename === 'teleports') {
            return new TeleportPad(sceneMgr, entityMgr)
        } else if (typename === 'docks') {
            return new Docks(sceneMgr, entityMgr)
        } else if (typename === 'powerstation') {
            return new PowerStation(sceneMgr, entityMgr)
        } else if (typename === 'barracks') {
            return new Barracks(sceneMgr, entityMgr)
        } else if (typename === 'upgrade') {
            return new Upgrade(sceneMgr, entityMgr)
        } else if (typename === 'geo-dome') {
            return new Geodome(sceneMgr, entityMgr)
        } else if (typename === 'orerefinery') {
            return new OreRefinery(sceneMgr, entityMgr)
        } else if (typename === 'gunstation') {
            return new GunStation(sceneMgr, entityMgr)
        } else if (typename === 'teleportbig') {
            return new TeleportBig(sceneMgr, entityMgr)
        } else {
            throw 'Unknown building type: ' + typename
        }
    }

}
