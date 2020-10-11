import { BaseScreen } from '../core/BaseScreen';

class MainMenuScreen extends BaseScreen {

    onLevelSelected: any;

    constructor() {
        super();
        this.onLevelSelected = null;
        // FIXME set size and append to container
    }

    showMainMenu() {
        // FIXME merge main menu implementation from rock-raiders-remake project
    }

    selectLevel(levelName) {
        this.hide();
        this.onLevelSelected(levelName);
    }

    showLevelSelection() {

    }

}

export { MainMenuScreen };
