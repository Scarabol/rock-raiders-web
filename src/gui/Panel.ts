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

export class PanelCrystalSideBar extends Panel {

    numOre: number = 0;
    numCrystal: number = 0;
    usedCrystals: number = 0;
    neededCrystals: number = 0;
    btnOre: Button;
    btnCrystal: Button;
    imgNoCrystal;
    imgSmallCrystal;
    imgUsedCrystal;
    imgOre;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.btnOre = iGet(this.buttons, 'PanelButton_CrystalSideBar_Ore');
        this.btnOre.label = this.numOre.toString();
        this.btnCrystal = iGet(this.buttons, 'PanelButton_CrystalSideBar_Crystals');
        this.btnCrystal.label = this.numCrystal.toString();
        this.imgNoCrystal = ResourceManager.getImage('Interface/RightPanel/NoSmallCrystal.bmp');
        this.imgSmallCrystal = ResourceManager.getImage('Interface/RightPanel/SmallCrystal.bmp');
        this.imgUsedCrystal = ResourceManager.getImage('Interface/RightPanel/UsedCrystal.bmp');
        this.imgOre = ResourceManager.getImage('Interface/RightPanel/CrystalSideBar_Ore.bmp');
    }

    onRedraw(context: CanvasRenderingContext2D) {
        super.onRedraw(context);
        // draw crystals
        let curX = this.x + this.img.width - 8;
        let curY = this.y + this.img.height - 34;
        for (let c = 0; (this.neededCrystals < 1 || c < Math.max(this.neededCrystals, this.numCrystal)) && curY >= Math.max(this.imgNoCrystal.height, this.imgSmallCrystal.height, this.imgUsedCrystal.height); c++) {
            let imgCrystal = this.imgNoCrystal;
            if (this.usedCrystals > c) {
                imgCrystal = this.imgUsedCrystal;
            } else if (this.numCrystal > c) {
                imgCrystal = this.imgSmallCrystal;
            }
            curY -= imgCrystal.height;
            context.drawImage(imgCrystal, curX - imgCrystal.width / 2, curY);
        }
        // draw ores
        curX = this.x + this.img.width - 21;
        curY = this.y + this.img.height - 42;
        for (let i = 0; i < this.numOre && curY >= this.imgOre.height; ++i) {
            curY -= this.imgOre.height;
            context.drawImage(this.imgOre, curX - this.imgOre.width / 2, curY);
        }
    }

}
