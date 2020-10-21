import { BaseScreen } from '../screen/BaseScreen';
import { ScreenLayer } from '../screen/ScreenLayer';
import { EventManager } from './engine/EventManager';
import { WorldManager } from './engine/WorldManager';
import { iGet } from '../core/Util';
import { ResourceManager } from './engine/ResourceManager';
import { AnimEntity } from './model/entity/AnimEntity';
import { Vector3 } from 'three';

export class GameScreen extends BaseScreen {

    onLevelEnd: (gameResult: string) => void; // TODO game result is actually an objects with much more data
    gameLayer: ScreenLayer;
    worldManager: WorldManager;

    constructor(eventManager: EventManager) {
        super(eventManager);
        this.gameLayer = this.createLayer({zIndex: 0, withContext: false});
        this.worldManager = new WorldManager(this);
        this.eventMgr.addMoveEventListener(this.gameLayer, (cx, cy) => this.moveMouseTorch(cx, cy));
        this.eventMgr.addClickEventListener(this.gameLayer, (cx, cy) => this.selectEntity(cx, cy));
        this.eventMgr.addKeyEventListener(this.gameLayer, (key) => this.keyPressed(key));
    }

    startLevel(levelName) {
        console.log('Starting level ' + levelName);
        this.worldManager.setup(levelName);
        // finally show all the layers
        this.gameLayer.show();
        this.show();
    }

    show() {
        super.show();
        this.worldManager.start();
    }

    hide() {
        this.worldManager.stop();
        super.hide();
    }

    resize(width: number, height: number) {
        super.resize(width, height);
        if (this.worldManager) this.worldManager.resize(width, height);
    }

    moveMouseTorch(screenX, screenY) {
        const rx = (screenX / this.gameLayer.canvas.width) * 2 - 1;
        const ry = -(screenY / this.gameLayer.canvas.height) * 2 + 1;
        this.worldManager.moveMouseTorch(rx, ry);
    }

    selectEntity(screenX, screenY): boolean {
        const rx = (screenX / this.gameLayer.canvas.width) * 2 - 1;
        const ry = -(screenY / this.gameLayer.canvas.height) * 2 + 1;
        this.worldManager.selectEntity(rx, ry);
        return false;
    }

    keyPressed(key: string): boolean {
        console.log('key pressed: ' + key);
        if (key === 't') {
            // TODO check max amount
            // look for unused toolstation/teleport
            const toolstations = this.worldManager.buildings['Toolstation'];
            // console.log(toolstations);
            // TODO check for powered/idling building
            const station = toolstations[0];
            // add raider with teleport animation
            const entityType = iGet(ResourceManager.entity, 'mini-figures/pilot/pilot.ae');
            const pilot = new AnimEntity(entityType);
            pilot.setActivity('TeleportIn', () => pilot.setActivity('Stand'));
            pilot.group.position.copy(station.group.position).add(new Vector3(0, 0, 20).applyEuler(station.group.rotation));
            pilot.group.rotation.copy(station.group.rotation);
            this.worldManager.sceneManager.scene.add(pilot.group);
            // after add to available pilots
            // default action: walk to building power path
        }
        return false;
    }

}
