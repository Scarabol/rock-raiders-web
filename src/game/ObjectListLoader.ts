import { MathUtils, Vector2 } from 'three'
import { EventBus } from '../event/EventBus'
import { RaidersChangedEvent } from '../event/LocalEvents'
import { TILESIZE } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
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
import { Crystal } from './model/collect/Crystal'
import { GameState } from './model/GameState'
import { Bat } from './model/monster/Bat'
import { SmallSpider } from './model/monster/SmallSpider'
import { Raider } from './model/raider/Raider'
import { SceneManager } from './SceneManager'
import { WorldManager } from './WorldManager'
import degToRad = MathUtils.degToRad

export class ObjectListLoader {

    static loadObjectList(worldMgr: WorldManager, sceneMgr: SceneManager, objectListConf, disableStartTeleport: boolean) {
        Object.values(objectListConf).forEach((olObject: any) => {
            const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type
            // all object positions are off by one tile, because they start at 1 not 0
            const worldPos = new Vector2(olObject.xPos, olObject.yPos).addScalar(-1).multiplyScalar(TILESIZE) // TODO assert that world pos is over terrain otherwise drop item
            const buildingType: string = ResourceManager.cfg('BuildingTypes', olObject.type)
            const radHeading = degToRad(olObject.heading)
            if (lTypeName === 'TVCamera'.toLowerCase()) {
                console.log('Camera heading: ' + Math.round(olObject.heading % 360))
                console.log('Camera target: ' + (olObject.xPos - 1) + '/' + (olObject.yPos - 1))
                const cameraOffset = new Vector2(6, 0).rotateAround(new Vector2(0, 0), radHeading + Math.PI / 2)
                const cameraPos = sceneMgr.getFloorPosition(cameraOffset.multiplyScalar(TILESIZE).add(worldPos))
                cameraPos.y += 4 * TILESIZE
                sceneMgr.camera.position.copy(cameraPos)
                sceneMgr.controls.target.copy(sceneMgr.getFloorPosition(worldPos))
                sceneMgr.controls.update()
                sceneMgr.setTorchPosition(new Vector2(worldPos.x, worldPos.y - TILESIZE / 2))
            } else if (lTypeName === 'Pilot'.toLowerCase()) {
                const raider = new Raider(worldMgr, sceneMgr)
                raider.changeActivity()
                raider.createPickSphere()
                raider.addToScene(worldPos, radHeading - Math.PI / 2)
                if (raider.group.visible) {
                    GameState.raiders.push(raider)
                    EventBus.publishEvent(new RaidersChangedEvent())
                } else {
                    GameState.raidersUndiscovered.push(raider)
                }
            } else if (buildingType) {
                console.log(olObject.type + ' heading: ' + Math.round(olObject.heading % 360))
                const entity = this.createBuildingByName(buildingType, worldMgr, sceneMgr)
                entity.placeDown(worldPos, -radHeading - Math.PI, disableStartTeleport)
            } else if (lTypeName === 'PowerCrystal'.toLowerCase()) {
                worldMgr.placeMaterial(new Crystal(worldMgr, sceneMgr), worldPos)
            } else if (lTypeName === 'SmallSpider'.toLowerCase()) {
                const spider = new SmallSpider(worldMgr, sceneMgr)
                spider.changeActivity()
                spider.addToScene(worldPos, radHeading)
                GameState.spiders.push(spider)
                spider.surfaces.forEach((s) => GameState.spidersBySurface.getOrUpdate(s, () => []).push(spider))
                spider.startMoving()
            } else if (lTypeName === 'Bat'.toLowerCase()) {
                const bat = new Bat(worldMgr, sceneMgr)
                bat.changeActivity()
                bat.addToScene(worldPos, radHeading)
                GameState.bats.push(bat)
                bat.startRandomMove()
            } else {
                // TODO implement remaining object types
                console.warn('Object type ' + olObject.type + ' not yet implemented')
            }
        })
    }

    private static createBuildingByName(buildingType: string, worldMgr: WorldManager, sceneMgr: SceneManager) {
        const typename = buildingType.slice(buildingType.lastIndexOf('/') + 1).toLowerCase()
        if (typename === 'toolstation') {
            return new Toolstation(worldMgr, sceneMgr)
        } else if (typename === 'teleports') {
            return new TeleportPad(worldMgr, sceneMgr)
        } else if (typename === 'docks') {
            return new Docks(worldMgr, sceneMgr)
        } else if (typename === 'powerstation') {
            return new PowerStation(worldMgr, sceneMgr)
        } else if (typename === 'barracks') {
            return new Barracks(worldMgr, sceneMgr)
        } else if (typename === 'upgrade') {
            return new Upgrade(worldMgr, sceneMgr)
        } else if (typename === 'geo-dome') {
            return new Geodome(worldMgr, sceneMgr)
        } else if (typename === 'orerefinery') {
            return new OreRefinery(worldMgr, sceneMgr)
        } else if (typename === 'gunstation') {
            return new GunStation(worldMgr, sceneMgr)
        } else if (typename === 'teleportbig') {
            return new TeleportBig(worldMgr, sceneMgr)
        } else {
            throw 'Unknown building type: ' + typename
        }
    }

}
