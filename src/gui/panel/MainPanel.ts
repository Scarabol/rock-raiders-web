import {IconPanel} from './IconPanel';
import {EventBus} from '../../game/event/EventBus';
import {SurfaceDeselectEvent, SurfaceSelectedEvent} from '../../game/event/LocalEvent';

export class MainPanel extends IconPanel {

    constructor() {
        super();
        this.mainPanel = this.addSubPanel(4);
        const buildingPanel = this.addSubPanel(10);
        const smallVehiclePanel = this.addSubPanel(6);
        const largeVehiclePanel = this.addSubPanel(5);
        const selectWallPanel = this.addSubPanel(4);
        const selectFloorPanel = this.addSubPanel(3);
        const teleportItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TeleportMan');
        teleportItem.disabled = false;
        const buildingItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildBuilding');
        buildingItem.disabled = false;
        buildingItem.onClick = () => this.mainPanel.toggleState(() => buildingPanel.toggleState());
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
        smallVehicleItem.onClick = () => this.mainPanel.toggleState(() => smallVehiclePanel.toggleState());
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'Hoverboard');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallDigger');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallTruck');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallCat');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallMLP');
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallHeli');
        const largeVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildLargeVehicle');
        largeVehicleItem.disabled = false;
        largeVehicleItem.onClick = () => this.mainPanel.toggleState(() => largeVehiclePanel.toggleState());
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'BullDozer');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'WalkerDigger');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeMLP');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeDigger');
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeCat');
        this.mainPanel.setMovedIn(true);
        const itemDrill = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dig');
        const itemReinforce = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Reinforce');
        const itemDynamite = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dynamite');
        const itemDeselect = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig');
        itemDeselect.disabled = false;
        itemDeselect.onClick = () => EventBus.publishEvent(new SurfaceDeselectEvent());
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, (event: SurfaceSelectedEvent) => {
            const type = event.type;
            if (type.floor) {
                this.selectSubPanel(selectFloorPanel);
            } else {
                this.selectSubPanel(selectWallPanel);
                itemDrill.disabled = !type.drillable;
                itemReinforce.disabled = !type.reinforcable;
                itemDynamite.disabled = !type.explodable;
                this.notifyRedraw(); // TODO performance: actually just the buttons need to be redrawn
            }
        });
        EventBus.registerEventListener(SurfaceDeselectEvent.eventKey, () => this.selectSubPanel(this.mainPanel));
        selectWallPanel.backBtn.onClick = () => EventBus.publishEvent(new SurfaceDeselectEvent());
        selectFloorPanel.backBtn.onClick = () => EventBus.publishEvent(new SurfaceDeselectEvent());
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_LayPath');
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_ClearRubble');
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence');
    }

}
