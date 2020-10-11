import { ResourceManager } from "../core/ResourceManager";

class MainMenuScreen {
    resMgr: ResourceManager;
    onLevelSelected;

    constructor(resourceManager: ResourceManager) {
        this.resMgr = resourceManager;
        this.onLevelSelected = null;
    }

    showMainMenu() {
        // FIXME merge main menu implementation from rock-raiders-remake project
        // FIXME continue with statically loading level 05 for debugging
        console.log(this);
        this.onLevelSelected('Level05');
    }

    showLevelSelection() {

    }
}

export { MainMenuScreen };
