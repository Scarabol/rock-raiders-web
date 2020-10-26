import { ResourceManager } from '../game/engine/ResourceManager';
import { BaseElement } from './BaseElement';

export class Button extends BaseElement {

    buttonType: string;
    imgNormal;
    imgHover;
    imgPressed;
    tooltip: string;

    constructor(parent: BaseElement, btnCfg) {
        super(parent);
        let normalFile, highlightFile, pressedFile;
        [this.buttonType, normalFile, highlightFile, pressedFile, this.relX, this.relY, this.width, this.height, this.tooltip] = btnCfg;
        if (normalFile) this.imgNormal = ResourceManager.getImage(normalFile);
        if (highlightFile) this.imgHover = ResourceManager.getImage(highlightFile);
        if (pressedFile) this.imgPressed = ResourceManager.getImage(pressedFile);
        this.updatePosition();
    }

    onClick() {
        console.log('button pressed: ' + this.buttonType);
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return;
        let img = this.imgNormal;
        if (this.disabled || this.pressed) {
            img = this.imgPressed;
        } else if (this.hover) {
            img = this.imgHover;
        }
        if (img) context.drawImage(img, this.x, this.y);
        super.onRedraw(context);
    }

}
