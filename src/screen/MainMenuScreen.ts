import { BaseScreen } from './BaseScreen';
import { ResourceManager } from '../resource/ResourceManager';
import { MainMenuFullCfg } from '../resource/wadworker/MainMenuFullCfg';
import { MainMenuLayer } from '../menu/MainMenuLayer';

export class MainMenuScreen extends BaseScreen {

    onLevelSelected: (levelName: string) => void = null;
    menus: MainMenuLayer[] = [];

    constructor() {
        super();
        const mainMenuFullCfg = ResourceManager.getResource('MainMenuFull') as MainMenuFullCfg;
        mainMenuFullCfg.menus.forEach((menuCfg) => {
            const layer = new MainMenuLayer(this, menuCfg);
            this.menus.push(layer);
            this.addLayer(layer);
        });
    }

    showMainMenu(index: number = 0) {
        this.hide();
        this.menus[index].show();
    }

    showLevelSelection() {
        this.showMainMenu(1);
    }

    selectLevel(levelName) {
        this.hide();
        this.onLevelSelected(levelName);
    }

}
