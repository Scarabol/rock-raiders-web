import { BaseScreen } from '../screen/BaseScreen';
import { WorldManager } from './engine/WorldManager';
import { SelectionLayer } from './layer/SelectionLayer';
import { GameLayer } from './layer/GameLayer';
import { GuiLayer } from './layer/GuiLayer';

export class GameScreen extends BaseScreen {

    onLevelEnd: (gameResult: string) => void; // TODO game result is actually an object with much more data
    gameLayer: GameLayer;
    selectionLayer: SelectionLayer;
    guiLayer: GuiLayer;
    worldManager: WorldManager;

    constructor() {
        super();
        this.gameLayer = this.addLayer(new GameLayer(), 0);
        this.selectionLayer = this.addLayer(new SelectionLayer(), 10);
        this.guiLayer = this.addLayer(new GuiLayer(), 20);
        this.worldManager = new WorldManager(this.gameLayer.canvas);
        this.gameLayer.setWorldManager(this.worldManager);
        this.selectionLayer.setWorldManager(this.worldManager);
    }

    startLevel(levelName) {
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

}
