import { MainMenuLayer } from './MainMenuLayer';
import { LevelEntryCfg, LevelsCfg } from '../resource/wadworker/LevelsCfg';
import { ResourceManager } from '../resource/ResourceManager';
import { MainMenuLevelButton } from './MainMenuLevelButton';
import { MainMenuScreen } from '../screen/MainMenuScreen';
import { MenuCfg } from '../resource/wadworker/MenuCfg';
import { iGet } from '../core/Util';
import { MainMenuPanel } from './MainMenuPanel';
import { MainMenuBaseItem } from './MainMenuBaseItem';
import { MainMenuWindow } from './MainMenuWindow';

export class LevelSelectLayer extends MainMenuLayer {

    constructor(screen: MainMenuScreen, menuCfg: MenuCfg, modeLevel: boolean) {
        super(screen, menuCfg);
        const levelsCfg: LevelsCfg = ResourceManager.getResource('Levels');
        const levelTextCfg = new LevelTextCfg();
        this.items.push(new MainMenuPanel(levelTextCfg.panelImgData, levelTextCfg.panelPos));
        const levelTextWindow = new MainMenuWindow(ResourceManager.getBitmapFont('Interface/Fonts/Font5_Hi.bmp'), levelTextCfg.window);
        levelTextWindow.setFirstLine(modeLevel ? levelTextCfg.level : levelTextCfg.tutorial);
        this.items.push(levelTextWindow);
        Object.keys(levelsCfg.levelsByName).forEach((levelKey) => {
            const level: LevelEntryCfg = levelsCfg.levelsByName[levelKey];
            const levelButton = new MainMenuLevelButton(this, levelKey, level);
            levelButton.onHoverChange = () => levelTextWindow.setSecondLine(levelButton.hover ? level.fullName : '');
            this.items.push(levelButton);
        });
        this.items.sort((a, b) => MainMenuBaseItem.compareZ(a, b));
    }

    show() {
        this.scrollY = 0;
        super.show();
    }

}

class LevelTextCfg {

    window = {x: 0, y: 0, w: 0, h: 0};
    panelImgData: ImageData;
    panelPos = {x: 0, y: 0, w: 0, h: 0};
    level: string = '';
    tutorial: string = '';

    constructor() {
        const cfg = ResourceManager.cfg('Menu', 'LevelText');
        const winCfg = iGet(cfg, 'Window');
        this.window = {x: winCfg[0], y: winCfg[1], w: winCfg[2], h: winCfg[3]};
        const panelCfg = iGet(cfg, 'Panel');
        this.panelImgData = ResourceManager.getImageData(panelCfg[0]);
        this.panelPos = {x: panelCfg[1], y: panelCfg[2], w: panelCfg[3], h: panelCfg[4]};
        this.level = iGet(cfg, 'Level').join(',').replace(/_/g, ' '); // TODO improve cfg handling, remove join
        this.tutorial = iGet(cfg, 'Tutorial').join(',').replace(/_/g, ' '); // TODO improve cfg handling, remove join
    }

}
