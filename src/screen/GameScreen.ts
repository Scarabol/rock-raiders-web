import { BaseScreen } from './BaseScreen';
import { WorldManager } from '../scene/WorldManager';
import { SelectionLayer } from '../game/layer/SelectionLayer';
import { GameLayer } from '../game/layer/GameLayer';
import { GuiLayer } from '../game/layer/GuiLayer';
import { Supervisor } from '../game/Supervisor';

export class GameScreen extends BaseScreen {

    onLevelEnd: () => void;
    gameLayer: GameLayer;
    selectionLayer: SelectionLayer;
    guiLayer: GuiLayer;
    worldManager: WorldManager;
    jobSupervisor: Supervisor;

    constructor() {
        super();
        this.gameLayer = this.addLayer(new GameLayer(), 0);
        this.selectionLayer = this.addLayer(new SelectionLayer(), 10);
        this.guiLayer = this.addLayer(new GuiLayer(), 20);
        this.worldManager = new WorldManager(this.gameLayer.canvas);
        this.gameLayer.setWorldManager(this.worldManager);
        this.selectionLayer.setWorldManager(this.worldManager);
        this.jobSupervisor = new Supervisor(this.worldManager);
    }

    startLevel(levelName) {
        this.worldManager.setup(levelName, this);
        // finally show all the layers
        this.gameLayer.show();
        this.show();
    }

    show() {
        super.show();
        this.worldManager.start();
        this.jobSupervisor.start();
    }

    hide() {
        this.worldManager.stop();
        this.jobSupervisor.stop();
        super.hide();
    }

    resize(width: number, height: number) {
        super.resize(width, height);
        if (this.worldManager) this.worldManager.resize(width, height);
    }

}
