import { SceneManager } from './SceneManager';
import { TerrainLoader } from './TerrainLoader';
import { ResourceManager } from '../resource/ResourceManager';
import { MathUtils, Raycaster, Vector3 } from 'three';
import { getRandom, iGet } from '../core/Util';
import { EventBus } from '../event/EventBus';
import { EntityAddedEvent, EntityType, JobCreateEvent, RaiderRequested, SpawnDynamiteEvent, SpawnMaterialEvent } from '../event/WorldEvents';
import { Raider } from './model/Raider';
import { GameState } from '../game/model/GameState';
import { Building } from '../game/model/entity/building/Building';
import { CollectJob, MoveJob } from '../game/model/job/Job';
import { CollectableEntity } from './model/collect/CollectableEntity';
import { CHECK_SPANW_RAIDER_TIMER, TILESIZE } from '../main';
import { EntityDeselected } from '../event/LocalEvents';
import { ObjectListLoader } from './ObjectListLoader';
import { Dynamite } from './model/collect/Dynamite';
import { DynamiteJob } from '../game/model/job/SurfaceJob';
import { NerpParser } from '../core/NerpParser';
import { NerpRunner } from '../core/NerpRunner';
import { GameScreen } from '../screen/GameScreen';
import degToRad = MathUtils.degToRad;

export class WorldManager {

    sceneManager: SceneManager;
    spawnRaiderInterval = null;
    nerpRunner: NerpRunner = null;
    nerpInterval = null;

    constructor(canvas: HTMLCanvasElement) {
        this.sceneManager = new SceneManager(canvas);
        this.sceneManager.cursorTorchlight.distance *= TILESIZE;
        EventBus.registerEventListener(EntityDeselected.eventKey, () => GameState.selectEntities([]));
        EventBus.registerEventListener(RaiderRequested.eventKey, (event: RaiderRequested) => {
            GameState.requestedRaiders = event.numRequested;
            if (GameState.requestedRaiders > 0 && !this.spawnRaiderInterval) {
                this.spawnRaiderInterval = setInterval(this.checkSpawnRaiders.bind(this), CHECK_SPANW_RAIDER_TIMER);
            }
        });
        EventBus.registerEventListener(SpawnDynamiteEvent.eventKey, (event: SpawnDynamiteEvent) => {
            const targetBuilding = GameState.getClosestBuildingByType(event.surface.getDigPositions()[0], Building.TOOLSTATION);
            if (!targetBuilding) {
                throw 'Could not find toolstation to spawn dynamite';
            }
            const pos = targetBuilding.getDropPosition(); // TODO use ToolNullName from cfg
            const dynamite = new Dynamite();
            dynamite.targetSurface = event.surface;
            dynamite.worldMgr = this;
            dynamite.setActivity('Normal');
            dynamite.group.position.copy(pos);
            this.sceneManager.scene.add(dynamite.group);
            EventBus.publishEvent(new JobCreateEvent(new DynamiteJob(event.surface, dynamite)));
        });
        EventBus.registerEventListener(SpawnMaterialEvent.eventKey, (event: SpawnMaterialEvent) => {
            this.addCollectable(event.collectable, event.spawnPosition.x, event.spawnPosition.z);
        });
    }

    setup(levelName: string, gameScreen: GameScreen) {
        const levelConf = ResourceManager.cfg('Levels', levelName);
        if (!levelConf) throw 'Could not find level configuration for "' + levelName + '"'; // TODO error handling
        console.log('Starting level ' + levelName + ' - ' + iGet(levelConf, 'FullName'));

        // create terrain mesh and add it to the scene
        this.sceneManager.terrain = TerrainLoader.loadTerrain(levelConf, this);
        this.sceneManager.scene.add(this.sceneManager.terrain.floorGroup);

        // load in non-space objects next
        const objectListConf = ResourceManager.getResource(iGet(levelConf, 'OListFile'));
        ObjectListLoader.loadObjectList(this, objectListConf);

        // load nerp script
        const nerpFile = iGet(levelConf, 'NERPFile');
        const nerpScriptContent = ResourceManager.getResource(nerpFile);
        this.nerpRunner = NerpParser.parse(nerpScriptContent);
        const nerpMsgFile = iGet(levelConf, 'NERPMessageFile');
        const nerpMessages = ResourceManager.getResource(nerpMsgFile);
        this.nerpRunner.messages.push(...nerpMessages);
        this.nerpRunner.onLevelComplete = () => gameScreen.onLevelEnd();

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
        this.nerpInterval = setInterval(() => { // FIXME track interval
            this.nerpRunner.execute();
        }, 2000);
        this.sceneManager.startRendering();
    }

    stop() {
        this.sceneManager.stopRendering();
        if (this.nerpInterval) clearInterval(this.nerpInterval);
        this.nerpInterval = null;
        if (this.spawnRaiderInterval) clearInterval(this.spawnRaiderInterval);
        this.spawnRaiderInterval = null;
    }

    resize(width: number, height: number) {
        if (this.sceneManager) this.sceneManager.renderer.setSize(width, height);
    }

    getTerrainIntersectionPoint(rx: number, ry: number): Vector3 {
        if (!this.sceneManager.terrain) return null;
        const raycaster = new Raycaster();
        raycaster.setFromCamera({x: rx, y: ry}, this.sceneManager.camera);
        const intersects = raycaster.intersectObjects(this.sceneManager.terrain.floorGroup.children);
        return intersects.length > 0 ? intersects[0].point : null;
    }

    setTorchPosition(position: Vector3) {
        this.sceneManager.cursorTorchlight.position.copy(position);
        this.sceneManager.cursorTorchlight.position.y = this.getTerrainHeight(position.x, position.z) + 2 * TILESIZE;
    }

    getTerrainHeight(worldX: number, worldZ: number): number {
        const raycaster = new Raycaster(new Vector3(Number(worldX), 3 * TILESIZE, Number(worldZ)), new Vector3(0, -1, 0));
        const intersect = raycaster.intersectObject(this.sceneManager.terrain.floorGroup, true);
        if (intersect.length > 0) {
            return intersect[0].point.y;
        } else {
            console.warn('could not determine terrain height for ' + worldX + '/' + worldZ);
            return 0;
        }
    }

    addCollectable(collectable: CollectableEntity, worldX: number, worldZ: number) {
        const worldY = this.getTerrainHeight(worldX, worldZ);
        collectable.worldMgr = this;
        collectable.group.position.set(worldX, worldY, worldZ);
        collectable.group.visible = this.sceneManager.terrain.getSurfaceFromWorld(collectable.group.position).discovered;
        this.sceneManager.scene.add(collectable.group);
        if (collectable.group.visible) {
            GameState.collectables.push(collectable);
            EventBus.publishEvent(new JobCreateEvent(new CollectJob(collectable)));
        } else {
            GameState.collectablesUndiscovered.push(collectable);
        }
    }

    checkSpawnRaiders() {
        if (GameState.requestedRaiders < 1) {
            if (this.spawnRaiderInterval) clearInterval(this.spawnRaiderInterval);
            this.spawnRaiderInterval = null;
            return;
        }
        if (GameState.raiders.length >= GameState.getMaxRaiders()) return;
        const spawnBuildings = GameState.getBuildingsByType(Building.TOOLSTATION, Building.TELEPORT_PAD)
            .filter((b) => b.isPowered() && !b.spawning);
        for (let c = 0; c < spawnBuildings.length && GameState.requestedRaiders > 0; c++) {
            GameState.requestedRaiders--;
            const station = spawnBuildings[c];
            station.spawning = true;
            const raider = new Raider();
            raider.worldMgr = this;
            raider.setActivity('TeleportIn', () => {
                station.spawning = false;
                raider.setActivity('Stand');
                raider.createPickSphere();
                const walkOutPos = station.getPosition().add(new Vector3(0, 0, TILESIZE * 3 / 4 + getRandom(TILESIZE / 2))
                    .applyEuler(station.getRotation()).applyAxisAngle(new Vector3(0, 1, 0), degToRad(-10 + getRandom(20))));
                walkOutPos.y = this.getTerrainHeight(walkOutPos.x, walkOutPos.z);
                raider.setJob(new MoveJob(walkOutPos));
                GameState.raiders.push(raider);
                EventBus.publishEvent(new EntityAddedEvent(EntityType.RAIDER, raider));
            });
            raider.group.position.copy(station.group.position).add(new Vector3(0, 0, TILESIZE / 2).applyEuler(station.group.rotation));
            raider.group.rotation.copy(station.group.rotation);
            this.sceneManager.scene.add(raider.group);
        }
    }

}
