import { ResourceManager } from '../resource/ResourceManager'
import { TILESIZE } from '../main'
import { MathUtils, Vector2, Vector3 } from 'three'
import { Raider } from './model/Raider'
import { GameState } from '../game/model/GameState'
import { Building } from '../game/model/entity/building/Building'
import { BuildingEntity } from './model/BuildingEntity'
import { SurfaceType } from './model/map/SurfaceType'
import { Crystal } from './model/collect/Crystal'
import { WorldManager } from './WorldManager'
import { EventBus } from '../event/EventBus'
import { EntityAddedEvent, EntityType } from '../event/WorldEvents'
import { SmallSpider } from '../game/model/entity/monster/SmallSpider'
import { Bat } from '../game/model/entity/monster/Bat'
import degToRad = MathUtils.degToRad

export class ObjectListLoader {

    static loadObjectList(worldMgr: WorldManager, objectListConf) {
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
                    EventBus.publishEvent(new EntityAddedEvent(EntityType.RAIDER, raider))
                } else {
                    GameState.raidersUndiscovered.push(raider)
                }
                worldMgr.sceneManager.scene.add(raider.group)
            } else if (buildingType) {
                const building = Building.getByName(buildingType)
                const entity = new BuildingEntity(building)
                entity.worldMgr = worldMgr
                entity.changeActivity()
                entity.createPickSphere()
                entity.group.position.set(worldX, worldMgr.getFloorHeight(worldX, worldZ), worldZ)
                entity.group.rotateOnAxis(new Vector3(0, 1, 0), -radHeading - Math.PI)
                entity.group.visible = worldMgr.sceneManager.terrain.getSurfaceFromWorld(entity.group.position).discovered
                if (entity.group.visible) {
                    GameState.buildings.push(entity)
                    EventBus.publishEvent(new EntityAddedEvent(EntityType.BUILDING, entity))
                } else {
                    GameState.buildingsUndiscovered.push(entity)
                }
                // TODO rotate building with normal vector of surface
                worldMgr.sceneManager.scene.add(entity.group)
                const primaryPathSurface = worldMgr.sceneManager.terrain.getSurfaceFromWorld(entity.group.position)
                primaryPathSurface.setBuilding(entity)
                primaryPathSurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
                primaryPathSurface.updateTexture()
                entity.surfaces.push(primaryPathSurface)
                if (building === Building.POWER_STATION) {
                    const secondaryOffset = new Vector3(0, 0, TILESIZE).applyAxisAngle(new Vector3(0, 1, 0), -radHeading + Math.PI / 2)
                    secondaryOffset.add(entity.group.position)
                    const secondarySurface = worldMgr.sceneManager.terrain.getSurfaceFromWorld(secondaryOffset)
                    secondarySurface.setBuilding(entity)
                    secondarySurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
                    secondarySurface.updateTexture()
                    entity.surfaces.push(secondarySurface)
                }
                if (building !== Building.GUNSTATION) {
                    const pathOffset = new Vector3(0, 0, TILESIZE).applyAxisAngle(new Vector3(0, 1, 0), -radHeading - Math.PI)
                    pathOffset.add(entity.group.position)
                    const pathSurface = worldMgr.sceneManager.terrain.getSurfaceFromWorld(pathOffset)
                    if (building === Building.GEODOME) pathSurface.building = entity
                    pathSurface.surfaceType = SurfaceType.POWER_PATH_BUILDING
                    pathSurface.updateTexture()
                    entity.surfaces.push(pathSurface)
                }
            } else if (lTypeName === 'PowerCrystal'.toLowerCase()) {
                worldMgr.addCollectable(new Crystal(), new Vector2(worldX, worldZ))
            } else if (lTypeName === 'SmallSpider'.toLowerCase()) {
                const spider = new SmallSpider()
                spider.worldMgr = worldMgr
                spider.changeActivity()
                spider.group.position.set(worldX, terrainY, worldZ)
                const currentSurface = spider.getCurrentSurface()
                spider.group.visible = currentSurface.discovered
                worldMgr.sceneManager.scene.add(spider.group)
                GameState.spiders.push(spider)
                GameState.spidersBySurface.getOrUpdate(currentSurface, () => []).push(spider)
                spider.startMoving()
            } else if (lTypeName === 'Bat'.toLowerCase()) {
                const bat = new Bat()
                bat.worldMgr = worldMgr
                bat.changeActivity()
                bat.group.position.set(worldX, bat.determinePosY(worldX, worldZ), worldZ)
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
        GameState.buildings.forEach((b) => b.surfaces.forEach((bSurf) => {
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    worldMgr.sceneManager.terrain.getSurface(bSurf.x + x, bSurf.y + y).updateTexture()
                }
            }
        }))
    }

}
