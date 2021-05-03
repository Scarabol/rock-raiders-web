import { MathUtils, Vector2, Vector3 } from 'three'
import { EventBus } from '../event/EventBus'
import { EntityAddedEvent } from '../event/WorldEvents'
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
            // all object positions are off by half a tile, because 0/0 is the top left corner of first tile
            const worldPos = new Vector2(olObject.xPos, olObject.yPos).addScalar(-1).multiplyScalar(TILESIZE)
            const buildingType: string = ResourceManager.cfg('BuildingTypes', olObject.type)
            const radHeading = degToRad(olObject.heading)
            if (lTypeName === 'TVCamera'.toLowerCase()) {
                const terrainY = worldMgr.getTerrainHeight(worldPos.x, worldPos.y)
                const loc = new Vector3(worldPos.x, terrainY, worldPos.y - TILESIZE / 2)
                const offset = new Vector3(5 * TILESIZE, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), radHeading - Math.PI / 16).add(loc)
                sceneMgr.camera.position.copy(offset)
                sceneMgr.camera.position.y = 4.5 * TILESIZE
                sceneMgr.controls.target.copy(loc)
                sceneMgr.controls.update()
                worldMgr.setTorchPosition(new Vector2(worldPos.x, worldPos.y - TILESIZE / 2))
            } else if (lTypeName === 'Pilot'.toLowerCase()) {
                const raider = new Raider(worldMgr, sceneMgr)
                raider.changeActivity()
                raider.createPickSphere()
                raider.addToScene(worldPos, radHeading - Math.PI / 2)
                if (raider.group.visible) {
                    GameState.raiders.push(raider)
                    EventBus.publishEvent(new EntityAddedEvent(raider))
                } else {
                    GameState.raidersUndiscovered.push(raider)
                }
            } else if (buildingType) {
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
        // update path textures when all buildings are added
        GameState.buildings.forEach((b) => b.surfaces.forEach((s) => s.neighbors.forEach((n) => n.updateTexture())))
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
