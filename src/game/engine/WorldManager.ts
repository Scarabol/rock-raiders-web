import { SceneManager } from './SceneManager';
import { TerrainLoader } from './TerrainLoader';
import { ResourceManager } from './ResourceManager';
import { MathUtils, Raycaster, Vector3 } from 'three';
import { iGet } from '../../core/Util';
import { ENERGY_PATH_BUILDING } from '../model/map/SurfaceType';
import { Terrain } from '../model/map/Terrain';
import { EventBus } from '../event/EventBus';
import { SurfaceDeselectEvent } from '../event/LocalEvents';
import { SpawnEvent, SpawnType } from '../event/WorldEvents';
import { Raider } from '../model/entity/Raider';
import { BuildingEntity } from '../model/entity/building/BuildingEntity';
import { GameState } from '../model/GameState';
import { SelectionType } from '../model/Selectable';
import { Building, TOOLSTATION } from '../model/entity/building/Building';
import degToRad = MathUtils.degToRad;

export class WorldManager {

    readonly tileSize: number = 40; // TODO read from cfg

    terrain: Terrain;
    sceneManager: SceneManager;

    constructor(canvas: HTMLCanvasElement) {
        this.sceneManager = new SceneManager(canvas);
        this.sceneManager.cursorTorchlight.distance *= this.tileSize;
        EventBus.registerEventListener(SurfaceDeselectEvent.eventKey, () => {
            if (GameState.selectionType === SelectionType.SURFACE) GameState.selectedEntities.forEach((entity) => entity.deselect());
        });
        EventBus.registerEventListener(SpawnEvent.eventKey, (event: SpawnEvent) => {
            // TODO check max amount
            // look for unused toolstation/teleport
            const toolstations = GameState.getBuildingsByType(TOOLSTATION);
            if (!toolstations || toolstations.length < 1) return;
            // console.log(toolstations);
            // TODO check for powered/idling building
            const station = toolstations[0];
            if (!station) return;
            if (event.type === SpawnType.RAIDER) {
                // add raider with teleport animation
                const raider = new Raider();
                raider.setActivity('TeleportIn', () => raider.setActivity('Stand'));
                raider.group.position.copy(station.group.position).add(new Vector3(0, 0, this.tileSize / 2).applyEuler(station.group.rotation));
                raider.group.rotation.copy(station.group.rotation);
                this.sceneManager.scene.add(raider.group);
                // TODO after add to available pilots
                // TODO default action: walk to building power path
            } else {
                console.warn('Spawn not yet implemented: ' + event.type);
            }
        });
    }

    setup(levelName: string) {
        const levelConf = ResourceManager.cfg('Levels', levelName);
        if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"'; // TODO error handling
        console.log('Starting level ' + levelName + ' - ' + iGet(levelConf, 'FullName'));

        // create terrain mesh and add it to the scene
        this.terrain = TerrainLoader.loadTerrain(levelConf);
        this.terrain.floorGroup.scale.set(this.tileSize, this.tileSize, this.tileSize); // TODO read terrain scale from level file
        this.terrain.floorGroup.updateWorldMatrix(true, true); // otherwise ray intersection is not working before rendering
        this.sceneManager.scene.add(this.terrain.floorGroup);

        // load in non-space objects next
        const objectList = ResourceManager.objectLists[levelConf['OListFile']];
        // console.log(objectList);
        Object.values(objectList).forEach((olObject: any) => {
            const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type;
            // all object positions are off by half a tile, because 0/0 is the top left corner of first tile
            const worldX = (olObject.xPos - 1) * this.tileSize;
            const worldZ = (olObject.yPos - 1) * this.tileSize;
            const worldY = this.getTerrainHeight(worldX, worldZ);
            const buildingType = ResourceManager.cfg('BuildingTypes', olObject.type);
            let radHeading = degToRad(olObject.heading);
            if (lTypeName === 'TVCamera'.toLowerCase()) {
                const target = new Vector3(worldX, worldY, worldZ - this.tileSize / 2);
                const offset = new Vector3(5 * this.tileSize, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), radHeading - Math.PI / 16).add(target);
                this.sceneManager.camera.position.copy(offset);
                this.sceneManager.camera.position.y = 4.5 * this.tileSize;
                this.sceneManager.controls.target.copy(target);
                this.sceneManager.controls.update();
                this.setTorchPosition(target);
            } else if (lTypeName === 'Pilot'.toLowerCase()) {
                const raider = new Raider();
                raider.setActivity('Stand');
                raider.group.position.set(worldX, worldY, worldZ);
                raider.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading - Math.PI / 2);
                this.sceneManager.scene.add(raider.group);
                GameState.raiders.push(raider);
            } else if (buildingType) {
                const building = Building.getByName(buildingType);
                const entity = new BuildingEntity(building);
                entity.setActivity('Stand');
                entity.group.position.set(worldX, worldY, worldZ);
                entity.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading);
                // TODO rotate building with normal vector of surface
                this.sceneManager.scene.add(entity.group);
                const path1Surface = this.terrain.getSurface(entity.group.position.x / this.tileSize, entity.group.position.z / this.tileSize);
                path1Surface.surfaceType = ENERGY_PATH_BUILDING;
                path1Surface.updateMesh();
                const pathOffset = new Vector3(0, 0, this.tileSize).applyAxisAngle(new Vector3(0, 1, 0), radHeading);
                pathOffset.add(entity.group.position);
                const path2Surface = this.terrain.getSurface(pathOffset.x / this.tileSize, pathOffset.z / this.tileSize);
                path2Surface.surfaceType = ENERGY_PATH_BUILDING;
                path2Surface.updateMesh();
                GameState.buildings.push(entity);
                // TODO need to explore map here?
            } else if (lTypeName === 'PowerCrystal'.toLowerCase()) {
                console.warn('Loose power crystals on start not yet implemented'); // TODO implement power crystals on start
                // const currentSpace = terrain[Math.floor(parseFloat(olObject.yPos))][Math.floor(parseFloat(olObject.xPos))];
                // collectables.push(new Collectable(currentSpace, "crystal", olObject.xPos, olObject.yPos));
            } else {
                // TODO implement remaining object types like: spider, drives and hovercraft
                console.log('Object type ' + olObject.type + ' not yet implemented');
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
        // TODO start simulation
        this.sceneManager.startRendering();
    }

    stop() {
        // TODO stop simulation
        this.sceneManager.stopRendering();
    }

    resize(width: number, height: number) {
        if (this.sceneManager) this.sceneManager.renderer.setSize(width, height);
    }

    moveMouseTorch(rx: number, ry: number) {
        if (!this.terrain) return;
        const raycaster = new Raycaster();
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneManager.camera);
        const intersects = raycaster.intersectObjects(this.terrain.floorGroup.children);
        if (intersects.length > 0) {
            this.setTorchPosition(intersects[0].point);
        }
    }

    setTorchPosition(position: Vector3) {
        this.sceneManager.cursorTorchlight.position.copy(position);
        this.sceneManager.cursorTorchlight.position.y = this.getTerrainHeight(position.x, position.z) + 2 * this.tileSize;
    }

    getTerrainHeight(worldX: number, worldZ: number): number {
        const raycaster = new Raycaster(new Vector3(Number(worldX), 3 * this.tileSize, Number(worldZ)), new Vector3(0, -1, 0));
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

}
