import { BaseScreen } from '../screen/BaseScreen';
import { ScreenLayer } from '../screen/ScreenLayer';
import { EventManager } from './engine/EventManager';
import { WorldManager } from './engine/WorldManager';

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
        if (key === 'c') {
            if (this.worldManager.world.selectedSurface) {
                if (this.worldManager.world.selectedSurface.surfaceType.floor) {
                    console.log('cannot collapse floor type');
                } else {
                    this.worldManager.world.selectedSurface.collapse();
                    this.worldManager.world.setSelectedSurface(null);
                }
            } else {
                console.log('key pressed but no surface selected');
            }
            return true;
        }
        return false;
    }

}
