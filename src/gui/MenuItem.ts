import { ResourceManager } from '../game/engine/ResourceManager';
import { BaseElement } from './BaseElement';
import { Panel } from './Panel';

export class MenuItem extends BaseElement {

    panel: Panel;
    itemKey: string;
    imgNormal;
    imgDisabled;
    imgPressed;
    tooltip: string;
    tooltipDisabled: string;
    hotkey: string;

    constructor(panel: Panel, menuItemGroup, itemKey) {
        super();
        this.panel = panel;
        this.itemKey = itemKey;
        this.relX = panel.img.width - 59;
        this.relY = 9;
        this.width = 40;
        this.height = 40;
        const menuItemCfg = ResourceManager.cfg(menuItemGroup, itemKey);
        let normalFile, disabledFile, pressedFile;
        if (menuItemCfg) {
            [normalFile, disabledFile, pressedFile, this.tooltip, this.tooltipDisabled, this.hotkey] = menuItemCfg;
        }
        if (normalFile) this.imgNormal = ResourceManager.getImage(normalFile);
        if (disabledFile) this.imgDisabled = ResourceManager.getImage(disabledFile);
        if (pressedFile) this.imgPressed = ResourceManager.getImage(pressedFile);
        this.disabled = true; // TODO only enable, if requirements are met, check each time game state changes
    }

    onClick() {
        console.log('menu item pressed: ' + this.itemKey);
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return;
        let img = this.imgNormal;
        if (this.disabled) {
            img = this.imgDisabled;
        } else if (this.pressed) {
            img = this.imgPressed;
        }
        if (img) context.drawImage(img, this.x, this.y);
        if (!this.disabled && this.hover) {
            context.strokeStyle = '#0f0';
            context.lineWidth = 2;
            context.strokeRect(this.x - context.lineWidth / 2, this.y - context.lineWidth / 2, this.width + context.lineWidth - 1, this.height + context.lineWidth - 1);
        }
        super.onRedraw(context);
    }

}
