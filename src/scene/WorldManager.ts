import { SceneManager } from './SceneManager';
import { TerrainLoader } from './TerrainLoader';
import { ResourceManager } from '../resource/ResourceManager';
import { MathUtils, Raycaster, Vector3 } from 'three';
import { getRandom, iGet } from '../core/Util';
import { SurfaceType } from './model/map/SurfaceType';
import { Terrain } from './model/map/Terrain';
import { EventBus } from '../event/EventBus';
import { JobCreateEvent, RaiderRequested, SpawnEvent } from '../event/WorldEvents';
import { Raider } from './model/Raider';
import { BuildingEntity } from './model/BuildingEntity';
import { GameState } from '../game/model/GameState';
import { Building } from '../game/model/entity/building/Building';
import { Crystal } from './model/collect/Crystal';
import { CollectJob, MoveJob } from '../game/model/job/Job';
import { Collectable } from './model/collect/Collectable';
import { CHECK_SPANW_RAIDER_TIMER, TILESIZE } from '../main';
import degToRad = MathUtils.degToRad;
import { EntityDeselected } from '../event/LocalEvents';

export class WorldManager {

    terrain: Terrain;
    sceneManager: SceneManager;
    spawnRaiderInterval = null;

    constructor(canvas: HTMLCanvasElement) {
        this.sceneManager = new SceneManager(canvas);
        this.sceneManager.cursorTorchlight.distance *= TILESIZE;
        EventBus.registerEventListener(EntityDeselected.eventKey, () => {
            GameState.selectedEntities.forEach((entity) => entity.deselect());
            GameState.selectedEntities = [];
            GameState.selectionType = null;
        });
        EventBus.registerEventListener(RaiderRequested.eventKey, (event: RaiderRequested) => {
            GameState.requestedRaiders = event.numRequested;
            if (GameState.requestedRaiders > 0 && !this.spawnRaiderInterval) {
                this.spawnRaiderInterval = setInterval(this.checkSpawnRaiders.bind(this), CHECK_SPANW_RAIDER_TIMER);
            }
        });
        EventBus.registerEventListener(SpawnEvent.eventKey, (event: SpawnEvent) => {
            console.warn('Spawn not yet implemented: ' + event.type);
        });
    }

    setup(levelName: string) {
        const levelConf = ResourceManager.cfg('Levels', levelName);
        if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"'; // TODO error handling
        console.log('Starting level ' + levelName + ' - ' + iGet(levelConf, 'FullName'));

        // create terrain mesh and add it to the scene
        this.terrain = TerrainLoader.loadTerrain(levelConf, this);
        this.sceneManager.scene.add(this.terrain.floorGroup);

        // load in non-space objects next
        const objectList = ResourceManager.getResource(iGet(levelConf, 'OListFile'));
        // console.log(objectList);
        Object.values(objectList).forEach((olObject: any) => {
            const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type;
            // all object positions are off by half a tile, because 0/0 is the top left corner of first tile
            const worldX = (olObject.xPos - 1) * TILESIZE;
            const worldZ = (olObject.yPos - 1) * TILESIZE;
            const worldY = this.getTerrainHeight(worldX, worldZ);
            const buildingType = ResourceManager.cfg('BuildingTypes', olObject.type);
            const radHeading = degToRad(olObject.heading);
            if (lTypeName === 'TVCamera'.toLowerCase()) {
                const target = new Vector3(worldX, worldY, worldZ - TILESIZE / 2);
                const offset = new Vector3(5 * TILESIZE, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), radHeading - Math.PI / 16).add(target);
                this.sceneManager.camera.position.copy(offset);
                this.sceneManager.camera.position.y = 4.5 * TILESIZE;
                this.sceneManager.controls.target.copy(target);
                this.sceneManager.controls.update();
                this.setTorchPosition(target);
            } else if (lTypeName === 'Pilot'.toLowerCase()) {
                const raider = new Raider();
                raider.worldMgr = this;
                raider.setActivity('Stand');
                raider.group.position.set(worldX, worldY, worldZ);
                raider.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading - Math.PI / 2);
                raider.group.visible = this.terrain.getSurfaceFromWorld(raider.group.position).discovered;
                if (raider.group.visible) {
                    this.sceneManager.scene.add(raider.group);
                    GameState.raiders.push(raider);
                }
            } else if (buildingType) {
                const building = Building.getByName(buildingType);
                const entity = new BuildingEntity(building);
                entity.worldMgr = this;
                entity.setActivity('Stand');
                entity.group.position.set(worldX, worldY, worldZ);
                entity.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading);
                entity.group.visible = this.terrain.getSurfaceFromWorld(entity.group.position).discovered;
                // TODO rotate building with normal vector of surface
                this.sceneManager.scene.add(entity.group);
                const path1Surface = this.terrain.getSurfaceFromWorld(entity.group.position);
                path1Surface.surfaceType = SurfaceType.POWER_PATH_BUILDING;
                path1Surface.updateMesh();
                const pathOffset = new Vector3(0, 0, TILESIZE).applyAxisAngle(new Vector3(0, 1, 0), radHeading);
                pathOffset.add(entity.group.position);
                const path2Surface = this.terrain.getSurfaceFromWorld(pathOffset);
                path2Surface.surfaceType = SurfaceType.POWER_PATH_BUILDING;
                path2Surface.updateMesh();
                if (entity.group.visible) {
                    GameState.buildings.push(entity); // TODO introduce raider/building/vehicle discovered event
                }
            } else if (lTypeName === 'PowerCrystal'.toLowerCase()) {
                this.addCollectable(new Crystal(), worldX, worldZ);
            } else {
                // TODO implement remaining object types like: spider, drives and hovercraft
                console.warn('Object type ' + olObject.type + ' not yet implemented');
            }
        });

        // TODO gather level start details for game result score calculation
        // levelConf.numOfCrystals = 0;
        // levelConf.numOfOres = 0;
        // levelConf.numOfDigables = 0;
        // for (let x = 0; x < terrain.length; x++) {
        //     for (let y = 0; y < terrain[x].length; y++) {
        //         const space = terrain[x][y];
        //         levelConf.numOfCrystals += space.containedCrystals;
        //         levelConf.numOfOres += space.containedOre + space.getRubbleOreContained();
        //         levelConf.numOfDigables += space.isDigable() ? 1 : 0;
        //     }
        // }
    }

    start() {
        this.sceneManager.startRendering();
    }

    stop() {
        this.sceneManager.stopRendering();
    }

    resize(width: number, height: number) {
        if (this.sceneManager) this.sceneManager.renderer.setSize(width, height);
    }

    getTerrainIntersectionPoint(rx: number, ry: number): Vector3 {
        if (!this.terrain) return null;
        const raycaster = new Raycaster();
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneManager.camera);
        const intersects = raycaster.intersectObjects(this.terrain.floorGroup.children);
        return intersects.length > 0 ? intersects[0].point : null;
    }

    setTorchPosition(position: Vector3) {
        this.sceneManager.cursorTorchlight.position.copy(position);
        this.sceneManager.cursorTorchlight.position.y = this.getTerrainHeight(position.x, position.z) + 2 * TILESIZE;
    }

    getTerrainHeight(worldX: number, worldZ: number): number {
        const raycaster = new Raycaster(new Vector3(Number(worldX), 3 * TILESIZE, Number(worldZ)), new Vector3(0, -1, 0));
        const intersect = raycaster.intersectObject(this.terrain.floorGroup, true);
        if (intersect.length > 0) {
            return intersect[0].point.y;
        } else {
            console.warn('could not determine terrain height for ' + worldX + '/' + worldZ);
            return 0;
        }
    }

    selectEntities(r1x: number, r1y: number, r2x: number, r2y: number) {
        // TODO determine entities in rect
        // => only one? => select
        // multiple? =>
        // raiders? => select group
        // buildings? => select building
        const raycaster = new Raycaster();
        raycaster.setFromCamera({x: r2x, y: r2y}, this.sceneManager.camera);
        const intersects = raycaster.intersectObject(this.sceneManager.scene, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj) {
                const userData = obj.userData;
                if (userData && userData.hasOwnProperty('selectable')) {
                    const selectable = userData['selectable'];
                    if (selectable) GameState.selectEntities([selectable]);
                    break;
                }
                obj = obj.parent;
            }
        }
    }

    addCollectable(collectable: Collectable, worldX: number, worldZ: number) {
        const worldY = this.getTerrainHeight(worldX, worldZ);
        collectable.worldMgr = this;
        collectable.group.position.set(worldX, worldY, worldZ);
        collectable.group.visible = this.terrain.getSurfaceFromWorld(collectable.group.position).discovered;
        this.sceneManager.scene.add(collectable.group);
        if (collectable.group.visible) {
            GameState.collectables.push(collectable);
            // TODO publish crystal discovered event
            EventBus.publishEvent(new JobCreateEvent(new CollectJob(collectable)));
        }
    }

    checkSpawnRaiders() {
        if (GameState.requestedRaiders < 1) {
            if (this.spawnRaiderInterval) clearInterval(this.spawnRaiderInterval);
            this.spawnRaiderInterval = null;
            return;
        }
        if (GameState.raiders.length >= GameState.getMaxRaiders()) return;
        const spawnBuildings = GameState.getBuildingsByType(Building.TOOLSTATION, Building.TELEPORTS)
            .filter((b) => b.isPowered() && !b.spawning);
        for (let c = 0; c < spawnBuildings.length && GameState.requestedRaiders > 0; c++) {
            GameState.requestedRaiders--;
            const station = spawnBuildings[c];
            station.spawning = true;
            const raider = new Raider();
            raider.worldMgr = this;
            raider.setActivity('TeleportIn', () => {
                station.spawning = false;
                const walkOutPos = station.getPosition().add(new Vector3(0, 0, TILESIZE / 2 + getRandom(TILESIZE / 4))
                    .applyEuler(station.getRotation()).applyAxisAngle(new Vector3(0, 1, 0), degToRad(-30 + getRandom(60))));
                walkOutPos.y = this.getTerrainHeight(walkOutPos.x, walkOutPos.z);
                raider.setJob(new MoveJob(walkOutPos));
                GameState.raiders.push(raider);
            });
            raider.group.position.copy(station.group.position).add(new Vector3(0, 0, TILESIZE / 2).applyEuler(station.group.rotation));
            raider.group.rotation.copy(station.group.rotation);
            this.sceneManager.scene.add(raider.group);
        }
    }

}
