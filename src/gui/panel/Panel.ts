import { ResourceManager } from '../../game/engine/ResourceManager';
import { Button } from '../Button';
import { BaseElement } from '../BaseElement';
import { iGet } from '../../core/Util';

export class Panel extends BaseElement {

    name: string;
    img;
    xIn: number = 0;
    yIn: number = 0;
    xOut: number = 0;
    yOut: number = 0;
    buttons = {};
    animated: boolean = false;

    constructor(panelName: string = null, panelsCfg: {} = {}, buttonsCfg: {} = {}) {
        super();
        this.name = panelName;
        if (panelsCfg && panelName) {
            let imgName;
            [imgName, this.xOut, this.yOut, this.xIn, this.yIn] = iGet(panelsCfg, panelName);
            this.img = ResourceManager.getImage(imgName);
            this.relX = this.xIn;
            this.relY = this.yIn;
        }
        if (buttonsCfg && panelName) {
            let panelButtonsCfg = iGet(buttonsCfg, panelName);
            if (panelButtonsCfg) {
                if (panelName === 'Panel_Encyclopedia') { // TODO refactor cfg handling
                    this.addButton(new Button(this, panelButtonsCfg));
                } else {
                    panelButtonsCfg.forEach((btnCfg) => this.addButton(new Button(this, btnCfg)));
                }
            }
        }
    }

    addButton<T extends Button>(button: T): T {
        this.buttons[button.buttonType] = button;
        this.addChild(button);
        return button;
    }

    isInactive(): boolean {
        return this.animated || super.isInactive();
    }

    updateAnimation(targetX: number, targetY: number, speed: number, onDone: () => any) {
        const diffX = targetX - this.relX;
        const diffY = targetY - this.relY;
        if (Math.abs(diffX) <= speed && Math.abs(diffY) <= speed) {
            this.relX = targetX;
            this.relY = targetY;
            this.animated = false;
            if (onDone) onDone();
        } else {
            this.relX += Math.round(Math.sign(diffX) * Math.sqrt(Math.abs(diffX)) * speed);
            this.relY += Math.round(Math.sign(diffY) * Math.sqrt(Math.abs(diffY)) * speed);
            const panel = this;
            setTimeout(() => panel.updateAnimation(targetX, targetY, speed, onDone), 1000 / 30); // synced with 30 FPS // TODO externalize constant
        }
        this.updatePosition();
        this.notifyRedraw();
    }

    toggle(onDone: () => any = null) {
        if (this.animated) return; // animation already in progress
        this.animated = true;
        if (this.relX === this.xIn && this.relY === this.yIn) {
            this.updateAnimation(this.xOut, this.yOut, 3, onDone); // TODO externalize constant
        } else {
            this.updateAnimation(this.xIn, this.yIn, 3, onDone); // TODO externalize constant
        }
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return;
        if (this.img) context.drawImage(this.img, this.x, this.y);
        super.onRedraw(context);
    }

}

export class TopPanel extends Panel {

    btnPriorities: Button;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.btnPriorities = iGet(this.buttons, 'PanelButton_TopPanel_Priorities');
    }

}

export class InfoDockPanel extends Panel {

    btnGoto: Button;
    btnClose: Button;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.btnGoto = iGet(this.buttons, 'PanelButton_InfoDock_Goto');
        this.btnGoto.disabled = true;
        this.btnClose = iGet(this.buttons, 'PanelButton_InfoDock_Close');
        this.btnClose.disabled = true;
    }

}
