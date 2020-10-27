import { InterfaceBackButton } from '../Button';
import { ResourceManager } from '../../game/engine/ResourceManager';
import { MenuItem } from '../MenuItem';
import { Panel } from './Panel';

export class IconPanel extends Panel {

    mainPanel: IconSubPanel;

    constructor() {
        super();
        this.xOut = 640 + 95;
        this.relX = this.xIn = 640 - 16;
        this.relY = this.yIn = this.yOut = 9;
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
        this.mainPanel.toggle();
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
        this.xIn = -this.img.width;
    }

    addMenuItem(menuItemGroup, itemKey) {
        // TODO assert that number of items is below planned size
        const menuItem = this.addChild(new MenuItem(this, menuItemGroup, itemKey));
        menuItem.relY += menuItem.height * this.countMenuItems;
        this.countMenuItems++;
        return menuItem;
    }

}
