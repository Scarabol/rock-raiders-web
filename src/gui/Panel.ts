import { ResourceManager } from '../game/engine/ResourceManager';
import { Button } from './Button';
import { BaseElement } from './BaseElement';
import { iGet } from '../core/Util';

export class Panel extends BaseElement {

    name: string;
    img;
    xIn: number;
    yIn: number;
    xOut: number;
    yOut: number;
    buttons = {};

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super();
        this.name = panelName;
        let imgName;
        [imgName, this.xOut, this.yOut, this.xIn, this.yIn] = iGet(panelsCfg, panelName);
        this.img = ResourceManager.getImage(imgName);
        this.relX = this.xIn;
        this.relY = this.yIn;
        let panelButtonsCfg = iGet(buttonsCfg, panelName);
        if (panelButtonsCfg) {
            if (panelName === 'Panel_Encyclopedia') { // TODO refactor cfg handling
                this.addButton(new Button(this, panelButtonsCfg));
            } else {
                panelButtonsCfg.forEach((btnCfg) => this.addButton(new Button(this, btnCfg)));
            }
        }
    }

    addButton(button: Button) {
        this.buttons[button.buttonType] = button;
        this.addChild(button);
    }

    toggle() { // TODO animate this, disable children during animation
        this.relX = this.relX === this.xIn ? this.xOut : this.xIn;
        this.relY = this.relY === this.yIn ? this.yOut : this.yIn;
        this.updatePosition();
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return;
        context.drawImage(this.img, this.x, this.y);
        super.onRedraw(context);
    }

}

export class RadarPanel extends Panel {

    fill: Panel;
    overlay: Panel;
    btnToggle: Button;
    btnMap: Button;
    btnTagged: Button;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.fill = this.addChild(new Panel('Panel_RadarFill', panelsCfg, buttonsCfg));
        this.overlay = this.addChild(new Panel('Panel_RadarOverlay', panelsCfg, buttonsCfg));
        this.overlay.hide();
        this.btnToggle = iGet(this.buttons, 'PanelButton_Radar_Toggle');
        this.btnToggle.onClick = () => {
            this.toggle();
            this.fill.toggle();
            this.overlay.toggle();
        };
        this.btnMap = iGet(this.buttons, 'PanelButton_Radar_MapView');
        this.btnMap.onClick = () => {
            // this.fill.hide();
            // this.overlay.hide();
        };
        this.btnTagged = iGet(this.buttons, 'PanelButton_Radar_TaggedObjectView');
        this.btnTagged.onClick = () => {
            // this.fill.show();
            // // this.overlay.show(); // TODO only show overlay, when entity selected
        };
    }

}

export class MessagePanel extends Panel {

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.relX = this.xOut = this.xIn = 42;
        this.relY = this.yOut = this.yIn = 409;
    }

}

export class TopPanel extends Panel {

    panelPriorities: Panel;
    btnPriorities: Button;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}, panelPriorities: Panel) {
        super(panelName, panelsCfg, buttonsCfg);
        this.panelPriorities = panelPriorities;
        this.btnPriorities = iGet(this.buttons, 'PanelButton_TopPanel_Priorities');
        this.btnPriorities.onClick = () => this.panelPriorities.toggle();
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
