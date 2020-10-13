import { BaseScreen } from '../gui/BaseScreen';
import { ResourceManager } from '../core/ResourceManager';
import { ScreenLayer } from '../gui/ScreenLayer';
import { SceneManager } from './engine/SceneManager';
import { Space } from './model/Space';
import * as THREE from 'three';
import { Map } from './model/Map';
import { Tile } from './model/Tile';

class GameScreen extends BaseScreen {

    onLevelEnd: (gameResult: string) => void; // TODO game result is actually an objects with much more data
    gameLayer: ScreenLayer;
    sceneManager: SceneManager;
    // guiLayer: ScreenLayer;
    levelConf: object;

    constructor(resourceManager: ResourceManager) {
        super(resourceManager);
        this.gameLayer = this.createLayer(0, false);
        this.sceneManager = new SceneManager(this.gameLayer.canvas);
        // this.guiLayer = this.createLayer(5);
    }

    startLevel(levelName) {
        console.log('Starting level ' + levelName);
        this.levelConf = this.resMgr.configuration['Lego*']['Levels'][levelName];
        if (!this.levelConf) throw 'Could not find level configuration for "' + levelName + '"'; // TODO error handling
        // console.log(this.levelConf);

        const themeName = this.levelConf['TextureSet'][1];
        // console.log(themeName);
        const textureSet = this.resMgr.configuration['Lego*']['Textures'][themeName];
        // console.log(textureSet);

        const terrainMap = this.resMgr.maps[(this.levelConf)['TerrainMap']].level;
        const pathMap = this.resMgr.maps[(this.levelConf)['PathMap']];
        const surfaceMap = this.resMgr.maps[(this.levelConf)['SurfaceMap']].level;
        const predugMap = this.resMgr.maps[(this.levelConf)['PreDugMap']].level;
        const cryOreMap = this.resMgr.maps[(this.levelConf)['CryOreMap']].level;
        // const olFileName = levelConf['OListFile'];
        // const fallinMapName = levelConf['FallinMap'];

        // load in Space types from terrain, surface, and path maps
        const terrain = [];
        for (let x = 0; x < terrainMap.length; x++) {
            terrain.push([]);
            for (let y = 0; y < terrainMap[x].length; y++) {
                // give the path map the highest priority, if it exists
                if (pathMap && pathMap.level[x][y] === 1) {
                    // rubble 1 Space id = 100
                    terrain[x].push(new Tile(100, x, y, surfaceMap[x][y]));
                } else if (pathMap && pathMap.level[x][y] === 2) {
                    // building power path Space id = -1
                    terrain[x].push(new Tile(-1, x, y, surfaceMap[x][y]));
                } else {
                    if (predugMap[x][y] === 0) {
                        // soil(5) was removed pre-release, so replace it with dirt(4)
                        if (terrainMap[x][y] === 5) {
                            terrain[x].push(new Tile(4, x, y, surfaceMap[x][y]));
                        } else {
                            terrain[x].push(new Tile(terrainMap[x][y], x, y, surfaceMap[x][y]));
                        }
                    } else if (predugMap[x][y] === 3 || predugMap[x][y] === 4) { // slug holes
                        terrain[x].push(new Tile(predugMap[x][y] * 10, x, y, surfaceMap[x][y]));
                    } else if (predugMap[x][y] === 1 || predugMap[x][y] === 2) {
                        if (terrainMap[x][y] === 6) {
                            terrain[x].push(new Tile(6, x, y, surfaceMap[x][y]));
                        } else if (terrainMap[x][y] === 9) {
                            terrain[x].push(new Tile(9, x, y, surfaceMap[x][y]));
                        } else {
                            terrain[x].push(new Tile(0, x, y, surfaceMap[x][y]));
                        }
                    }

                    const currentCryOre = cryOreMap[x][y];
                    if (currentCryOre % 2 === 1) {
                        terrain[x][y].containedCrystals = (currentCryOre + 1) / 2;
                    } else {
                        terrain[x][y].containedOre = currentCryOre / 2;
                    }
                }
            }
        }
        // console.log(terrain);

        // FIXME create mesh and add it to the scene

        const map = new Map(this.resMgr, terrain.length, terrain[0].length, textureSet.texturebasename); // TODO maybe width/height must be swapped here
        map.spaces = terrain;
        map.spaces.forEach(col => col.forEach(s => s.map = map));
        map.spaces.forEach(col => col.forEach(s => s.update()));

        // FIXME fill map.tiles from terrain array

        // for (let x = 0; x < terrain.length; x++) {
        //     const col: Tile[] = [];
        //     for (let y = 0; y < terrain[x].length; y++) {
        //         const t = terrain[x][y];
        //         console.log(t);
        //         col.push(new Tile(map, x, y));
        //     }
        //     map.spaces.push(col);
        // }
        // map.spaces.forEach(col => col.forEach(s => s.update()));

        this.sceneManager.scene.add(map.floorGroup);

        // ensure that any walls which do not meet the 'supported' requirement crumble at the start
        // for (let i = 0; i < this.resMgr.maps[predugMapName].level.length; i++) {
        //     for (let r = 0; r < this.resMgr.maps[predugMapName].level[i].length; r++) {
        //         if (terrain[i][r].isWall) {
        //             terrain[i][r].checkWallSupported(null, true);
        //         }
        //     }
        // }

        // 'touch' all exposed spaces in the predug map so that they appear as visible from the start
        // for (let i = 0; i < this.resMgr.maps[predugMapName].level.length; i++) {
        //     for (let r = 0; r < this.resMgr.maps[predugMapName].level[i].length; r++) {
        //         const currentPredug = this.resMgr.maps[predugMapName].level[i][r];
        //         if (currentPredug === 1 || currentPredug === 3) {
        //             touchAllAdjacentSpaces(terrain[i][r]);
        //         }
        //     }
        // }

        // add land-slide frequency to Spaces
        // if (this.resMgr.maps[fallinMapName]) {
        //     for (let i = 0; i < this.resMgr.maps[fallinMapName].level.length; i++) {
        //         for (let r = 0; r < this.resMgr.maps[fallinMapName].level[i].length; r++) {
        //             terrain[i][r].setLandSlideFrequency(this.resMgr.maps[fallinMapName].level[i][r]);
        //         }
        //     }
        // }

        // load in non-space objects next
        // const objectList = GameManager.objectLists[olFileName];
        // Object.values(objectList).forEach(function (olObject) {
        //     const lTypeName = olObject.type ? olObject.type.toLowerCase() : olObject.type;
        //     // all object positions seem to be off by one
        //     olObject.xPos--;
        //     olObject.yPos--;
        //     const buildingType = getBuildingType(olObject.type);
        //     if (lTypeName === "TVCamera".toLowerCase()) {
        //         // coords need to be rescaled since 1 unit in LRR is 1, but 1 unit in the remake is tileSize (128)
        //         gameLayer.cameraX = olObject.xPos * tileSize;
        //         gameLayer.cameraY = olObject.yPos * tileSize;
        //         // center the camera
        //         gameLayer.cameraX -= GameManager.screenWidth / 2;
        //         gameLayer.cameraY -= GameManager.screenHeight / 2;
        //     } else if (lTypeName === "Pilot".toLowerCase()) {
        //         // note inverted x/y coords for terrain list
        //         const newRaider = new Raider(terrain[parseInt(olObject.yPos, 10)][parseInt(olObject.xPos, 10)]);
        //         newRaider.setCenterX(olObject.xPos * tileSize);
        //         newRaider.setCenterY(olObject.yPos * tileSize);
        //         // convert to radians (note that heading angle is rotated 90 degrees clockwise relative to the remake angles)
        //         newRaider.drawAngle = (olObject.heading - 90) / 180 * Math.PI;
        //         raiders.push(newRaider);
        //     } else if (buildingType) {
        //         // FIXME add all parts for this building type not only main space
        //         const currentSpace = terrain[Math.floor(parseFloat(olObject.yPos))][Math.floor(parseFloat(olObject.xPos))];
        //         currentSpace.setTypeProperties(buildingType);
        //         currentSpace.headingAngle = (olObject.heading - 90) / 180 * Math.PI;
        //         // check if this space was in a wall, but should now be touched
        //         checkRevealSpace(currentSpace);
        //         // set drawAngle to headingAngle now if this space isn't initially in the fog
        //         if (currentSpace.touched) {
        //             currentSpace.drawAngle = currentSpace.headingAngle - Math.PI / 2;
        //         }
        //         if (currentSpace.powerPathSpace) { // not all buildings have a native power path
        //             // check if this building's power path space was in a wall, but should now be touched
        //             checkRevealSpace(currentSpace.powerPathSpace);
        //             currentSpace.powerPathSpace.setTypeProperties("building power path");
        //         }
        //     } else if (lTypeName === "PowerCrystal".toLowerCase()) {
        //         const currentSpace = terrain[Math.floor(parseFloat(olObject.yPos))][Math.floor(parseFloat(olObject.xPos))];
        //         collectables.push(new Collectable(currentSpace, "crystal", olObject.xPos, olObject.yPos));
        //     } else {
        //         // TODO implement remaining object types like: spider, drives and hovercraft
        //         console.log("Object type " + olObject.type + " not yet implemented");
        //     }
        // });

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

}

export { GameScreen };
