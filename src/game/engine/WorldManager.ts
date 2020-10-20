import { SceneManager } from './SceneManager';
import { TerrainLoader } from './TerrainLoader';
import { ResourceManager } from './ResourceManager';
import { MathUtils, Raycaster, Vector3 } from 'three';
import { iGet } from '../../core/Util';
import { ENERGY_PATH_BUILDING } from '../model/SurfaceType';
import { GameScreen } from '../GameScreen';
import { Terrain } from '../model/Terrain';
import { Selectable } from '../model/Selectable';
import degToRad = MathUtils.degToRad;

export class WorldManager {

    // readonly tileSize: number = 40; // TODO externalize tile size

    terrain: Terrain;
    sceneManager: SceneManager;
    selectedEntity: Selectable;

    constructor(screen: GameScreen) {
        this.sceneManager = new SceneManager(screen.gameLayer.canvas);
    }

    setup(levelName: string) {
        const levelConf = ResourceManager.configuration['Lego*']['Levels'][levelName];
        if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"'; // TODO error handling

        // create terrain mesh and add it to the scene
        this.terrain = TerrainLoader.loadTerrain(levelConf);
        const worldScale = 40; // BlockSize in lego.cfg
        this.terrain.floorGroup.scale.set(worldScale, worldScale, worldScale); // TODO read terrain scale from level file
        this.sceneManager.scene.add(this.terrain.floorGroup);

        // load in non-space objects next
        const objectList = ResourceManager.objectLists[levelConf['OListFile']];
        Object.values(objectList).forEach((olObject: any) => {
            const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type;
            // all object positions are off by half a tile, because 0/0 is the top left corner of first tile
            olObject.xPos += 0.5;
            olObject.yPos += 0.5;
            const buildingType = ResourceManager.configuration['Lego*']['BuildingTypes'][olObject.type];
            if (lTypeName === 'TVCamera'.toLowerCase()) {
                // coords need to be rescaled since 1 unit in LRR is 1, but 1 unit in the remake is tileSize (128)
                const tileSize = 40; // TODO scale with surface scale (BlockSize)
                this.sceneManager.camera.position.set(olObject.xPos * tileSize, 1.25 * tileSize, olObject.yPos * tileSize);  // TODO scale with terrain/buildings use half of max terrain height
                let targetOffset = new Vector3(-40, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), degToRad(olObject.heading)); // scale with BlockSize
                let target = new Vector3().copy(this.sceneManager.camera.position).add(targetOffset);
                target.y = 0.5; // TODO scale with terrain/buildings use half of max terrain height BlockSize gety from terrain
                this.sceneManager.controls.target.copy(target);
                this.sceneManager.controls.update();
            } else if (lTypeName === 'Pilot'.toLowerCase()) {
                const pilot = iGet(ResourceManager.entity, 'mini-figures/pilot/pilot.ae');
                pilot.setActivity('Stand');
                pilot.loadTextures();
                pilot.group.position.set((olObject.xPos - 1.5) * 40, 18, (olObject.yPos + 1.5) * 40); // TODO get y from terrain // TODO why offset needed?
                pilot.group.rotateOnAxis(new Vector3(0, 1, 0), degToRad(olObject['heading'] - 90));
                this.sceneManager.scene.add(pilot.group);
                // TODO need to explore map here?
            } else if (buildingType) {
                const bfilename = buildingType + '/' + buildingType.slice(buildingType.lastIndexOf('/') + 1) + '.ae';
                const entity = iGet(ResourceManager.entity, bfilename);
                // entity.setActivity('Teleport', () => {
                //     console.log('switching animation to stand');
                entity.setActivity('Stand');
                //     this.handleGroup(this, [entity.group]);
                // });
                entity.loadTextures();
                entity.group.position.set((olObject.xPos - 1.5) * 40, 18, (olObject.yPos + 1.5) * 40); // TODO get y from terrain // TODO why offset needed?
                entity.group.rotateOnAxis(new Vector3(0, 1, 0), degToRad(olObject['heading'] - 90));
                this.sceneManager.scene.add(entity.group);
                const path1Surface = this.terrain.getWorldSurface(entity.group.position.x, entity.group.position.z);
                path1Surface.surfaceType = ENERGY_PATH_BUILDING;
                path1Surface.updateMesh();
                const pathOffset = new Vector3(0, 0, 40) // TODO scale with terrain
                    .applyAxisAngle(new Vector3(0, 1, 0), degToRad(olObject['heading'] - 90));
                pathOffset.add(entity.group.position);
                const path2Surface = this.terrain.getWorldSurface(pathOffset.x, pathOffset.z);
                path2Surface.surfaceType = ENERGY_PATH_BUILDING;
                path2Surface.updateMesh();
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
            const hit = intersects[0].point;
            hit.y += 3 * 40; // TODO adapt to terrain scale
            this.sceneManager.cursorTorchlight.position.copy(hit);
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
