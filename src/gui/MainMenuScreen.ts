import { BaseScreen } from './BaseScreen';
import { ScreenLayer } from './ScreenLayer';

class MainMenuScreen extends BaseScreen {

    onLevelSelected: (levelName: string) => void = null;
    startCanvas: ScreenLayer;
    loadGameCanvas: ScreenLayer;
    levelSelectCanvas: ScreenLayer;
    trainingSelectCanvas: ScreenLayer;
    showTeamCanvas: ScreenLayer;
    optionsCanvas: ScreenLayer;

    constructor() {
        super();
        this.startCanvas = this.createLayer();
        this.loadGameCanvas = this.createLayer();
        this.levelSelectCanvas = this.createLayer();
        this.trainingSelectCanvas = this.createLayer();
        this.showTeamCanvas = this.createLayer();
        this.optionsCanvas = this.createLayer();
        this.onWindowResize(); // resize and redraw all canvas
    }

    redraw() {
        super.redraw();
        // TODO redraw all canvas
    }

    showMainMenu() {
        // FIXME merge main menu implementation from rock-raiders-remake project
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
