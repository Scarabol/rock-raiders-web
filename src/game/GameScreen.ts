import { BaseScreen } from '../screen/BaseScreen';
import { ScreenLayer } from '../screen/ScreenLayer';
import { EventManager, MOUSE_BUTTON } from './engine/EventManager';
import { WorldManager } from './engine/WorldManager';
import { iGet } from '../core/Util';
import { ResourceManager } from './engine/ResourceManager';
import { AnimEntity } from './model/entity/AnimEntity';
import { Vector3 } from 'three';

export class GameScreen extends BaseScreen {

    onLevelEnd: (gameResult: string) => void; // TODO game result is actually an object with much more data
    gameLayer: ScreenLayer;
    selectionLayer: ScreenLayer; // TODO refactoring? move selection layer to separate class?
    selectStart: { x: number, y: number } = null;
    worldManager: WorldManager;

    constructor(eventManager: EventManager) {
        super(eventManager);
        this.gameLayer = this.createLayer({zIndex: 0, withContext: false});
        this.selectionLayer = this.createLayer({zIndex: 0, alpha: true});
        this.worldManager = new WorldManager(this);
        this.eventMgr.addCursorMoveListener(this.gameLayer, (cx, cy) => this.moveMouseTorch(cx, cy));
        this.eventMgr.addMouseDownListener(this.selectionLayer, MOUSE_BUTTON.MAIN, (cx, cy) => this.startSelection(cx, cy));
        this.eventMgr.addCursorMoveListener(this.selectionLayer, (cx, cy) => this.changeSelection(cx, cy));
        this.eventMgr.addMouseUpListener(this.selectionLayer, MOUSE_BUTTON.MAIN, (cx, cy) => this.selectEntities(cx, cy));
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

    startSelection(screenX: number, screenY: number) {
        this.selectStart = {x: screenX, y: screenY};
        return true;
    }

    changeSelection(screenX: number, screenY: number) {
        if (this.selectStart) {
            this.selectionLayer.context.clearRect(0, 0, this.selectionLayer.canvas.width, this.selectionLayer.canvas.height);
            this.selectionLayer.context.strokeStyle = '#0f0';
            this.selectionLayer.context.strokeRect(this.selectStart.x, this.selectStart.y, screenX - this.selectStart.x, screenY - this.selectStart.y);
        }
    }

    selectEntities(screenX: number, screenY: number) {
        this.selectionLayer.context.clearRect(0, 0, this.selectionLayer.canvas.width, this.selectionLayer.canvas.height);
        const rx = (screenX / this.gameLayer.canvas.width) * 2 - 1;
        const ry = -(screenY / this.gameLayer.canvas.height) * 2 + 1;
        this.worldManager.selectEntity(rx, ry); // TODO select multiple entities, but do not select floor with selection rect
        this.selectStart = null;
        return true;
    }

}
