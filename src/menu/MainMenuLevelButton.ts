import { MainMenuLayer } from './MainMenuLayer';
import { MainMenuButton } from './MainMenuButton';
import { LevelEntryCfg } from '../resource/wadworker/LevelsCfg';
import { ResourceManager } from '../resource/ResourceManager';

export class MainMenuLevelButton extends MainMenuButton {

    layer: MainMenuLayer;
    imgActive = null;
    imgInactive = null;
    imgCross = null;
    unlocked: boolean = false;
    levelKey: string = '';

    constructor(layer: MainMenuLayer, levelKey: string, levelCfg: LevelEntryCfg) {
        super();
        this.layer = layer;
        this.actionName = 'selectlevel';
        this.levelKey = levelKey;
        this.x = levelCfg.frontEndX;
        this.y = levelCfg.frontEndY;
        const [imgActive, imgInactive, imgCross] = levelCfg.menuBMP;
        this.imgActive = ResourceManager.getImage(imgActive);
        this.imgInactive = ResourceManager.getImage(imgInactive);
        this.imgCross = ResourceManager.getImage(imgCross);
        this.width = Math.max(this.imgActive.width, this.imgInactive.width, this.imgCross.width);
        this.height = Math.max(this.imgActive.height, this.imgInactive.height, this.imgCross.height);
        this.unlocked = levelCfg.frontEndOpen;
    }

    draw(context: CanvasRenderingContext2D) {
        super.draw(context);
        let img = this.imgCross;
        if (this.unlocked) img = this.hover ? this.imgActive : this.imgInactive;
        context.drawImage(img, this.x, this.y - this.layer.scrollY);
    }

}