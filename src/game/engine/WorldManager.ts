import { SceneManager } from './SceneManager';
import { TerrainLoader } from './TerrainLoader';
import { ResourceManager } from './ResourceManager';
import { MathUtils, Raycaster, Vector3 } from 'three';
import { iGet } from '../../core/Util';
import { ENERGY_PATH_BUILDING } from '../model/SurfaceType';
import { GameScreen } from '../GameScreen';
import { Terrain } from '../model/Terrain';
import { Selectable } from '../model/Selectable';
import { AnimationEntity } from '../entity/AnimationEntity';
import degToRad = MathUtils.degToRad;

export class WorldManager {

    readonly tileSize: number = 40; // TODO read from cfg

    terrain: Terrain;
    sceneManager: SceneManager;
    selectedEntity: Selectable;
    buildings = {};

    constructor(screen: GameScreen) {
        this.sceneManager = new SceneManager(screen.gameLayer.canvas);
        this.sceneManager.cursorTorchlight.distance *= this.tileSize;
    }

    setup(levelName: string) {
        const levelConf = ResourceManager.configuration['Lego*']['Levels'][levelName];
        if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"'; // TODO error handling
        console.log(iGet(levelConf, 'FullName'));

        // create terrain mesh and add it to the scene
        this.terrain = TerrainLoader.loadTerrain(levelConf);
        this.terrain.floorGroup.scale.set(this.tileSize, this.tileSize, this.tileSize); // TODO read terrain scale from level file
        this.terrain.floorGroup.updateWorldMatrix(true, true); // otherwise ray intersection is not working before rendering
        this.sceneManager.scene.add(this.terrain.floorGroup);

        // load in non-space objects next
        const objectList = ResourceManager.objectLists[levelConf['OListFile']];
        console.log(objectList);
        Object.values(objectList).forEach((olObject: any) => {
            const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type;
            // all object positions are off by half a tile, because 0/0 is the top left corner of first tile
            const worldX = (olObject.xPos - 1) * this.tileSize;
            const worldZ = (olObject.yPos - 1) * this.tileSize;
            const worldY = this.getTerrainHeight(worldX, worldZ);
            const buildingType = ResourceManager.configuration['Lego*']['BuildingTypes'][olObject.type];
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
                const pilot = iGet(ResourceManager.entity, 'mini-figures/pilot/pilot.ae');
                pilot.setActivity('Stand');
                pilot.loadTextures();
                pilot.group.position.set(worldX, worldY, worldZ);
                pilot.group.rotateOnAxis(new Vector3(0, 1, 0), radHeading);
                this.sceneManager.scene.add(pilot.group);
            } else if (buildingType) {
                const bfilename = buildingType + '/' + buildingType.slice(buildingType.lastIndexOf('/') + 1) + '.ae';
                const entity = iGet(ResourceManager.entity, bfilename);
                entity.setActivity('Stand');
                entity.loadTextures();
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
                const buildingName = buildingType.slice(buildingType.lastIndexOf('/') + 1);
                this.buildings[buildingName] = this.buildings[buildingName] || [];
                this.buildings[buildingName].push(entity); // TODO push more complex building type???
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

    selectEntity(rx: number, ry: number) {
        if (this.selectedEntity) {
            this.selectedEntity.deselect();
            this.selectedEntity = null;
        }
        const raycaster = new Raycaster();
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneManager.camera);
        const intersects = raycaster.intersectObjects(this.sceneManager.scene.children, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj) {
                const userData = obj.userData;
                if (userData && userData.hasOwnProperty('selectable')) {
                    this.selectedEntity = userData['selectable'].select();
                    break;
                }
                obj = obj.parent;
            }
        }
    }

}
