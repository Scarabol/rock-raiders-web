import { BaseScreen } from './BaseScreen';
import { ScreenLayer } from './ScreenLayer';
import { ResourceManager } from '../game/engine/ResourceManager';

export class MainMenuScreen extends BaseScreen {

    onLevelSelected: (levelName: string) => void = null;
    startCanvas: ScreenLayer;
    loadGameCanvas: ScreenLayer;
    levelSelectCanvas: ScreenLayer;
    trainingSelectCanvas: ScreenLayer;
    showTeamCanvas: ScreenLayer;
    optionsCanvas: ScreenLayer;

    constructor() {
        super();
        this.startCanvas = this.addLayer(new ScreenLayer());
        this.loadGameCanvas = this.addLayer(new ScreenLayer());
        this.levelSelectCanvas = this.addLayer(new ScreenLayer());
        this.trainingSelectCanvas = this.addLayer(new ScreenLayer());
        this.showTeamCanvas = this.addLayer(new ScreenLayer());
        this.optionsCanvas = this.addLayer(new ScreenLayer());
    }

    showMainMenu() {
        this.hide();
        const menuBg = ResourceManager.getImage(ResourceManager.cfg('Menu', 'MainMenuFull', 'Menu1', 'MenuImage'));
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
