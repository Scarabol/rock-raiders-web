import { MainMenuLayer } from './MainMenuLayer';
import { MainMenuItemCfg } from './MainMenuItemCfg';
import { MainMenuButton } from './MainMenuButton';

export class MainMenuLabelButton extends MainMenuButton {

    labelImgLo = null;
    labelImgHi = null;

    constructor(layer: MainMenuLayer, cfg: MainMenuItemCfg) {
        super();
        this.labelImgLo = layer.loFont.createTextImage(cfg.label);
        this.labelImgHi = layer.hiFont.createTextImage(cfg.label);
        this.width = Math.max(this.labelImgLo.width, this.labelImgHi.width);
        this.height = Math.max(this.labelImgLo.height, this.labelImgHi.height);
        this.x = layer.cfg.autoCenter ? (layer.fixedWidth - this.width) / 2 : layer.cfg.position[0] + cfg.x;
        this.y = layer.cfg.position[1] + cfg.y;
        this.actionName = cfg.actionName;
        if (this.actionName === 'Next') this.targetIndex = Number(cfg.target.substring('menu'.length)) - 1;
    }

    draw(context: CanvasRenderingContext2D) {
        super.draw(context);
        const img = this.hover && !this.pressed ? this.labelImgHi : this.labelImgLo;
        context.drawImage(img, this.x, this.y);
    }

}