import { ResourceManager } from "../core/ResourceManager";

class MainMenuScreen {
    resMgr: ResourceManager;
    onLevelSelected;
    canvas: HTMLCanvasElement;

    constructor(resourceManager: ResourceManager, gameCanvasContainerId: string) {
        this.resMgr = resourceManager;
        this.onLevelSelected = null;
        this.canvas = <HTMLCanvasElement>document.createElement('canvas');
        // FIXME set size and append to container
    }

    showMainMenu() {
        // FIXME merge main menu implementation from rock-raiders-remake project
    }

    selectLevel(levelName) {
        this.canvas.style.visibility = 'hidden';
        this.onLevelSelected(levelName);
    }

    showLevelSelection() {

    }
}

export { MainMenuScreen };
