import { ResourceManager } from '../game/engine/ResourceManager';
import { Button, InterfaceBackButton } from './Button';
import { BaseElement } from './BaseElement';
import { iGet } from '../core/Util';
import { GameState } from '../game/model/GameState';
import { MenuItem } from './MenuItem';

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

export class RadarPanel extends Panel {

    fill: Panel;
    overlay: Panel;
    btnToggle: Button;
    btnMap: Button;
    btnTagged: Button;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.fill = this.addChild(new Panel('Panel_RadarFill', panelsCfg, buttonsCfg));
        // fill cords given in abs, turn to rel (otherwise animation wont work)
        this.fill.relX = this.relX - this.fill.relX;
        this.fill.relY = this.relY - this.fill.relY;
        this.overlay = this.addChild(new Panel('Panel_RadarOverlay', panelsCfg, buttonsCfg));
        // this.overlay.hide();
        this.btnToggle = iGet(this.buttons, 'PanelButton_Radar_Toggle');
        this.btnToggle.onClick = () => this.toggle();
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

    imgAir;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.relX = this.xOut = this.xIn = 42;
        this.relY = this.yOut = this.yIn = 409;
        this.imgAir = ResourceManager.getImage('Interface/Airmeter/msgpanel_air_juice.bmp');
    }

    onRedraw(context: CanvasRenderingContext2D) {
        super.onRedraw(context);
        if (GameState.airlevel > 0) {
            const width = Math.round(236 * GameState.airlevel);
            context.drawImage(this.imgAir, this.x + 85, this.y + 6, width, 8);
        }
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

    btnOre: Button;
    btnCrystal: Button;
    imgNoCrystal;
    imgSmallCrystal;
    imgUsedCrystal;
    imgOre;

    constructor(panelName: string, panelsCfg: {}, buttonsCfg: {}) {
        super(panelName, panelsCfg, buttonsCfg);
        this.btnOre = iGet(this.buttons, 'PanelButton_CrystalSideBar_Ore');
        this.btnOre.label = GameState.numOre.toString();
        this.btnCrystal = iGet(this.buttons, 'PanelButton_CrystalSideBar_Crystals');
        this.btnCrystal.label = GameState.numCrystal.toString();
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
        for (let c = 0; (GameState.neededCrystals < 1 || c < Math.max(GameState.neededCrystals, GameState.numCrystal)) && curY >= Math.max(this.imgNoCrystal.height, this.imgSmallCrystal.height, this.imgUsedCrystal.height); c++) {
            let imgCrystal = this.imgNoCrystal;
            if (GameState.usedCrystals > c) {
                imgCrystal = this.imgUsedCrystal;
            } else if (GameState.numCrystal > c) {
                imgCrystal = this.imgSmallCrystal;
            }
            curY -= imgCrystal.height;
            context.drawImage(imgCrystal, curX - imgCrystal.width / 2, curY);
        }
        // draw ores
        curX = this.x + this.img.width - 21;
        curY = this.y + this.img.height - 42;
        for (let i = 0; i < GameState.numOre && curY >= this.imgOre.height; ++i) {
            curY -= this.imgOre.height;
            context.drawImage(this.imgOre, curX - this.imgOre.width / 2, curY);
        }
    }

}

export class IconPanel extends Panel {

    mainPanel: IconSubPanel;

    constructor() {
        super();
        this.mainPanel = this.addChild(new IconSubPanel(4));
        const buildingPanel = this.addChild(new IconSubPanel(10, this.mainPanel));
        const smallVehiclePanel = this.addChild(new IconSubPanel(6, this.mainPanel));
        const largeVehiclePanel = this.addChild(new IconSubPanel(5, this.mainPanel));
        const teleportItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TeleportMan');
        const buildingItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildBuilding');
        buildingItem.disabled = false;
        buildingItem.onClick = () => this.mainPanel.toggle(() => buildingPanel.toggle());
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Toolstation');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'TeleportPad');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Docks');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Powerstation');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Barracks');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Upgrade');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Geo-dome');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'OreRefinery');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Gunstation');
        buildingPanel.addMenuItem('InterfaceBuildImages', 'TeleportBIG');
        const smallVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildSmallVehicle');
        smallVehicleItem.disabled = false;
        smallVehicleItem.onClick = () => this.mainPanel.toggle(() => smallVehiclePanel.toggle());
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'Hoverboard');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallDigger');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallTruck');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallCat');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallMLP');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallHeli');
        const largeVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildLargeVehicle');
        largeVehicleItem.disabled = false;
        largeVehicleItem.onClick = () => this.mainPanel.toggle(() => largeVehiclePanel.toggle());
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'BullDozer');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'WalkerDigger');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeMLP');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeDigger');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeCat');
        this.mainPanel.toggle(); // TODO this should be triggered by existance of a working/discovered toolstation?
    }

}

export class IconSubPanel extends Panel {

    countMenuItems: number = 0;

    constructor(numOfItems, parentPanel: Panel = null) {
        super();
        if (parentPanel) {
            const panel = this;
            const backBtn = this.addButton(new InterfaceBackButton(this));
            backBtn.onClick = () => panel.toggle(() => parentPanel.toggle());
        }
        const frameImgCfg = ResourceManager.cfg('InterfaceSurroundImages', numOfItems.toString());
        const [imgName, val1, val2, val3, val4, imgNameWoBackName, woBack1, woBack2] = frameImgCfg;
        this.img = parentPanel ? ResourceManager.getImage(imgName) : ResourceManager.getImage(imgNameWoBackName);
        this.xIn = 640 - 16 - this.img.width;
        this.relX = this.xOut = 640;
        this.relY = this.yIn = this.yOut = 9;
    }

    addMenuItem(menuItemGroup, itemKey) {
        // TODO assert that number of items is below planned size
        const menuItem = this.addChild(new MenuItem(this, menuItemGroup, itemKey));
        menuItem.relY += menuItem.height * this.countMenuItems;
        this.countMenuItems++;
        return menuItem;
    }

}
