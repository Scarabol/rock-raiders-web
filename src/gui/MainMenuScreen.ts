import { BaseScreen } from './BaseScreen';
import { ScreenLayer } from './ScreenLayer';
import { ResourceManager } from '../game/engine/ResourceManager';

class MainMenuScreen extends BaseScreen {

    onLevelSelected: (levelName: string) => void = null;
    startCanvas: ScreenLayer;
    loadGameCanvas: ScreenLayer;
    levelSelectCanvas: ScreenLayer;
    trainingSelectCanvas: ScreenLayer;
    showTeamCanvas: ScreenLayer;
    optionsCanvas: ScreenLayer;

    constructor(resourceManager: ResourceManager) {
        super(resourceManager);
        this.startCanvas = this.createLayer();
        this.loadGameCanvas = this.createLayer();
        this.levelSelectCanvas = this.createLayer();
        this.trainingSelectCanvas = this.createLayer();
        this.showTeamCanvas = this.createLayer();
        this.optionsCanvas = this.createLayer();
        this.onWindowResize(); // resize and redraw all canvas
    }

    showMainMenu() {
        this.hide();
        const menuBg = this.resMgr.getImage(this.resMgr.configuration['Lego*']['Menu']['MainMenuFull']['Menu1']['MenuImage']).canvas;
        this.startCanvas.onRedraw = (context => {
            context.drawImage(menuBg, 0, 0, this.width, this.height);
        });
        this.startCanvas.show();
        // TODO merge main menu implementation from rock-raiders-remake project here
    }

    showLevelSelection() {
        // TODO directly jump to the level selection screen
    }

    selectLevel(levelName) {
        this.hide();
        this.onLevelSelected(levelName);
    }

}

export { MainMenuScreen };
