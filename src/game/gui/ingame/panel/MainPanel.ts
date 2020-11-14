import { IconPanel } from './IconPanel';
import { EventBus } from '../../../../event/EventBus';
import { BuildingSelected, EntityDeselected, RaiderSelected, SurfaceSelectedEvent, VehicleSelected } from '../../../../event/LocalEvents';
import { JobCreateEvent, RaiderRequested, SpawnEvent, SpawnType } from '../../../../event/WorldEvents';
import { SurfaceJob, SurfaceJobType } from '../../../model/job/Job';
import { GameState } from '../../../model/GameState';
import { Surface } from '../../../../scene/model/map/Surface';

export class MainPanel extends IconPanel {

    constructor() {
        super();
        this.mainPanel = this.addSubPanel(4);
        EventBus.registerEventListener(EntityDeselected.eventKey, () => this.selectSubPanel(this.mainPanel));
        const buildingPanel = this.addSubPanel(10);
        const smallVehiclePanel = this.addSubPanel(6);
        const largeVehiclePanel = this.addSubPanel(5);
        const selectWallPanel = this.addSubPanel(4);
        const selectFloorPanel = this.addSubPanel(3);
        const selectRubblePanel = this.addSubPanel(2);
        const selectBuildingPanel = this.addSubPanel(4);
        const selectRaiderPanel = this.addSubPanel(10);
        const selectVehiclePanel = this.addSubPanel(7);
        const teleportItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TeleportMan');
        teleportItem.disabled = false;
        teleportItem.onClick = () => EventBus.publishEvent(new RaiderRequested(GameState.requestedRaiders + 1));
        // TODO add decrease requested raider spawn option
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
        itemDrill.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface;
            if (!selectedSurface.hasJobType(SurfaceJobType.DRILL)) {
                EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.DRILL, selectedSurface)));
            }
            EventBus.publishEvent(new EntityDeselected());
        };
        const itemReinforce = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Reinforce');
        itemReinforce.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface;
            if (!selectedSurface.hasJobType(SurfaceJobType.REINFORCE)) {
                EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.REINFORCE, selectedSurface)));
            }
            EventBus.publishEvent(new EntityDeselected());
        };
        const itemDynamite = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dynamite');
        itemDynamite.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface;
            if (!selectedSurface.hasJobType(SurfaceJobType.BLOW)) {
                EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.BLOW, selectedSurface)));
                EventBus.publishEvent(new SpawnEvent(SpawnType.DYNAMITE));
            }
            EventBus.publishEvent(new EntityDeselected());
        };
        const itemDeselect = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig');
        itemDeselect.disabled = false;
        itemDeselect.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface;
            selectedSurface.cancelJobs();
            EventBus.publishEvent(new EntityDeselected());
        };
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, (event: SurfaceSelectedEvent) => {
            const surface = event.surface;
            const type = surface.surfaceType;
            if (type.floor) {
                if (surface.hasRubble()) {
                    this.selectSubPanel(selectRubblePanel);
                } else {
                    this.selectSubPanel(selectFloorPanel);
                }
            } else {
                this.selectSubPanel(selectWallPanel);
                itemDrill.disabled = !type.drillable;
                itemReinforce.disabled = !type.reinforcable;
                itemDynamite.disabled = !type.explodable;
                this.notifyRedraw(); // TODO performance: actually just the buttons need to be redrawn
            }
        });
        selectWallPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected());
        selectFloorPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected());
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_LayPath');
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_RemovePath');
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence');
        selectRubblePanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected());
        const clearRubbleItem = selectRubblePanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_ClearRubble');
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, (event: SurfaceSelectedEvent) => {
            clearRubbleItem.disabled = !event.surface.hasRubble();
            this.notifyRedraw(); // TODO performance: actually just the buttons need to be redrawn
        });
        clearRubbleItem.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface;
            EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.CLEAR_RUBBLE, selectedSurface)));
            EventBus.publishEvent(new EntityDeselected());
        };
        selectRubblePanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence');
        EventBus.registerEventListener(BuildingSelected.eventKey, () => this.selectSubPanel(selectBuildingPanel));
        EventBus.registerEventListener(EntityDeselected.eventKey, () => this.selectSubPanel(this.mainPanel));
        selectBuildingPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected());
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair');
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PowerOff'); // TODO other option is Interface_MenuItem_PowerOn
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding');
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding');
        EventBus.registerEventListener(RaiderSelected.eventKey, () => this.selectSubPanel(selectRaiderPanel));
        selectRaiderPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected());
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GoFeed');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_UnLoadMinifigure');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_MinifigurePickUp');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GetTool');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DropBirdScarer');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeMan');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSkill');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoFirstPerson');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoSecondPerson');
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteMan');
        EventBus.registerEventListener(VehicleSelected.eventKey, () => this.selectSubPanel(selectVehiclePanel));
        selectVehiclePanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected());
    }

}
