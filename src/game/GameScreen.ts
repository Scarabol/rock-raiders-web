import { BaseScreen } from '../screen/BaseScreen';
import { ResourceManager } from './engine/ResourceManager';
import { ScreenLayer } from '../screen/ScreenLayer';
import { SceneManager } from './engine/SceneManager';
import { TerrainLoader } from './engine/TerrainLoader';
import { EventManager } from './engine/EventManager';
import { IngameUI } from './gui/IngameUI';
import * as THREE from 'three';
import { MathUtils, Raycaster, Vector3 } from 'three';
import { Terrain } from './model/Terrain';
import { iGet } from '../core/Util';
import degToRad = MathUtils.degToRad;

export class GameScreen extends BaseScreen {

    onLevelEnd: (gameResult: string) => void; // TODO game result is actually an objects with much more data
    gameLayer: ScreenLayer;
    sceneManager: SceneManager;
    terrain: Terrain;
    ingameUI: IngameUI;
    levelConf: object;

    constructor(resourceManager: ResourceManager, eventManager: EventManager) {
        super(resourceManager, eventManager);
        this.gameLayer = this.createLayer({zIndex: 0, withContext: false});
        this.eventMgr.addMoveEventListener(this.gameLayer, (cx, cy) => this.moveMouseTorch(cx, cy));
        this.sceneManager = new SceneManager(this.gameLayer.canvas);
        // this.ingameUI = new IngameUI(this);
    }

    startLevel(levelName) {
        console.log('Starting level ' + levelName);
        this.levelConf = this.resMgr.configuration['Lego*']['Levels'][levelName];
        if (!this.levelConf) throw 'Could not find level configuration for "' + levelName + '"'; // TODO error handling
        // console.log(this.levelConf);

        // create terrain mesh and add it to the scene
        this.terrain = new TerrainLoader().loadTerrain(this.resMgr, this.levelConf);
        const worldScale = 40; // BlockSize in lego.cfg
        this.terrain.floorGroup.scale.set(worldScale, worldScale, worldScale); // TODO read terrain scale from level file
        this.sceneManager.scene.add(this.terrain.floorGroup);

        // load in non-space objects next
        const objectList = this.resMgr.objectLists[this.levelConf['OListFile']];
        Object.values(objectList).forEach((olObject: any) => {
            const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type;
            // all object positions are off by half a tile, because 0/0 is the top left corner of first tile
            olObject.xPos += 0.5;
            olObject.yPos += 0.5;
            const buildingType = this.resMgr.configuration['Lego*']['BuildingTypes'][olObject.type];
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
                console.log('Loose raiders on start not yet implemented'); // TODO implement raiders on start
                // note inverted x/y coords for terrain list
                // const newRaider = new Raider(terrain[parseInt(olObject.yPos, 10)][parseInt(olObject.xPos, 10)]);
                // newRaider.setCenterX(olObject.xPos * tileSize);
                // newRaider.setCenterY(olObject.yPos * tileSize);
                // // convert to radians (note that heading angle is rotated 90 degrees clockwise relative to the remake angles)
                // newRaider.drawAngle = (olObject.heading - 90) / 180 * Math.PI;
                // raiders.push(newRaider);
                // TODO need to explore map here?
            } else if (buildingType) {
                const bfilename = buildingType + '/' + buildingType.slice(buildingType.lastIndexOf('/') + 1) + '.ae';
                const entity = iGet(this.resMgr.entity, bfilename);
                entity.setActivity('Teleport', () => {
                    console.log('switching animation to stand');
                    entity.setActivity('Stand');
                });
                // console.log(entity.group.children);
                const resMgr = this.resMgr;
                entity.group.children.filter((child) => child.type === 'Mesh')
                    .map((c) => c.material)
                    .forEach((material) => {
                        material.filter((m) => m.userData)
                            .map((m) => m.userData)
                            .filter((d) => d.hasOwnProperty('textureFilename'))
                            .map((userData) => {
                                const textureFilename = userData.textureFilename;
                                // console.log(textureFilename);
                                const texture = resMgr.getTexture(textureFilename);
                                // console.log(texture);
                                if (texture) {
                                    material.map = texture;
                                    material.map.wrapS = THREE.RepeatWrapping;
                                    material.map.wrapT = THREE.RepeatWrapping;
                                    material.map.minFilter = THREE.NearestFilter;
                                    material.map.magFilter = THREE.NearestFilter;
                                    material.needsUpdate = true; // TODO needed?
                                }
                            });
                    });
                entity.group.position.set((olObject.xPos - 1.5) * 40, 18, (olObject.yPos + 1.5) * 40); // TODO get y from terrain // TODO why offset needed?
                entity.group.rotateOnAxis(new Vector3(0, 1, 0), degToRad(olObject['heading'] - 90)); // TODO y offset?
                this.sceneManager.scene.add(entity.group);
                // TODO add some kind of power paths
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

        // finally show all the layers
        this.gameLayer.show();
        this.show();
    }

    show() {
        super.show();
        this.sceneManager.startRendering();
    }

    hide() {
        this.sceneManager.stopRendering();
        super.hide();
    }

    resize(width: number, height: number) {
        super.resize(width, height);
        if (this.sceneManager) this.sceneManager.renderer.setSize(width, height);
    }

    moveMouseTorch(cx, cy) { // TODO better move this to scene manager?
        const rx = (cx / this.gameLayer.canvas.width) * 2 - 1;
        const ry = -(cy / this.gameLayer.canvas.height) * 2 + 1;
        const raycaster = new Raycaster();
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneManager.camera);
        const intersects = raycaster.intersectObjects(this.terrain.floorGroup.children, true);
        if (intersects.length > 0) {
            const hit = intersects[0].point;
            hit.y += 3 * 40; // TODO adapt to terrain scale?
            this.sceneManager.cursorTorchlight.position.copy(hit);
        }
    }

}
