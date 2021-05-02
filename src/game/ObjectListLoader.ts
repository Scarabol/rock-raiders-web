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
import { WorldManager } from './WorldManager'
import degToRad = MathUtils.degToRad

export class ObjectListLoader {

    static loadObjectList(worldMgr: WorldManager, objectListConf, disableStartTeleport: boolean) {
        Object.values(objectListConf).forEach((olObject: any) => {
            const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type
            // all object positions are off by half a tile, because 0/0 is the top left corner of first tile
            const worldX = (olObject.xPos - 1) * TILESIZE
            const worldZ = (olObject.yPos - 1) * TILESIZE
            const terrainY = worldMgr.getTerrainHeight(worldX, worldZ)
            const buildingType: string = ResourceManager.cfg('BuildingTypes', olObject.type)
            const radHeading = degToRad(olObject.heading)
            if (lTypeName === 'TVCamera'.toLowerCase()) {
                const offset = new Vector3(5 * TILESIZE, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), radHeading - Math.PI / 16).add(new Vector3(worldX, terrainY, worldZ - TILESIZE / 2))
                worldMgr.sceneManager.camera.position.copy(offset)
                worldMgr.sceneManager.camera.position.y = 4.5 * TILESIZE
                worldMgr.sceneManager.controls.target.copy(new Vector3(worldX, terrainY, worldZ - TILESIZE / 2))
                worldMgr.sceneManager.controls.update()
                worldMgr.setTorchPosition(new Vector2(worldX, worldZ - TILESIZE / 2))
            } else if (lTypeName === 'Pilot'.toLowerCase()) {
                const raider = new Raider()
                raider.worldMgr = worldMgr
                raider.changeActivity()
                raider.createPickSphere()
                raider.group.position.set(worldX, terrainY, worldZ)
                raider.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading - Math.PI / 2)
                raider.group.visible = worldMgr.sceneManager.terrain.getSurfaceFromWorld(raider.group.position).discovered
                if (raider.group.visible) {
                    GameState.raiders.push(raider)
                    EventBus.publishEvent(new EntityAddedEvent(raider))
                } else {
                    GameState.raidersUndiscovered.push(raider)
                }
                worldMgr.sceneManager.scene.add(raider.group)
            } else if (buildingType) {
                const entity = this.createBuildingByName(buildingType)
                entity.addToScene(worldMgr, worldX, worldZ, -radHeading - Math.PI, disableStartTeleport)
            } else if (lTypeName === 'PowerCrystal'.toLowerCase()) {
                worldMgr.placeMaterial(new Crystal(), new Vector2(worldX, worldZ))
            } else if (lTypeName === 'SmallSpider'.toLowerCase()) {
                const spider = new SmallSpider()
                spider.worldMgr = worldMgr
                spider.changeActivity()
                spider.group.position.set(worldX, terrainY, worldZ)
                const currentSurface = worldMgr.sceneManager.terrain.getSurfaceFromWorld(spider.group.position)
                spider.group.visible = currentSurface.discovered
                worldMgr.sceneManager.scene.add(spider.group)
                GameState.spiders.push(spider)
                GameState.spidersBySurface.getOrUpdate(currentSurface, () => []).push(spider)
                spider.startMoving()
            } else if (lTypeName === 'Bat'.toLowerCase()) {
                const bat = new Bat()
                bat.worldMgr = worldMgr
                bat.changeActivity()
                bat.group.position.set(worldX, bat.floorOffset, worldZ)
                bat.group.visible = worldMgr.sceneManager.terrain.getSurfaceFromWorld(bat.group.position).discovered
                worldMgr.sceneManager.scene.add(bat.group)
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

    private static createBuildingByName(buildingType: string) {
        const typename = buildingType.slice(buildingType.lastIndexOf('/') + 1).toLowerCase()
        if (typename === 'toolstation') {
            return new Toolstation()
        } else if (typename === 'teleports') {
            return new TeleportPad()
        } else if (typename === 'docks') {
            return new Docks()
        } else if (typename === 'powerstation') {
            return new PowerStation()
        } else if (typename === 'barracks') {
            return new Barracks()
        } else if (typename === 'upgrade') {
            return new Upgrade()
        } else if (typename === 'geo-dome') {
            return new Geodome()
        } else if (typename === 'orerefinery') {
            return new OreRefinery()
        } else if (typename === 'gunstation') {
            return new GunStation()
        } else if (typename === 'teleportbig') {
            return new TeleportBig()
        } else {
            throw 'Unknown building type: ' + typename
        }
    }

}
