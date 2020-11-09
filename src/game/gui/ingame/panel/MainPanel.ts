import { IconPanel } from './IconPanel';
import { EventBus } from '../../../../event/EventBus';
import { BuildingDeselected, BuildingSelected, SurfaceDeselectEvent, SurfaceSelectedEvent } from '../../../../event/LocalEvents';
import { JobCreateEvent, JobDeleteEvent, RaiderDeselected, RaiderSelected, SpawnEvent, SpawnType, VehicleDeselected, VehicleSelected } from '../../../../event/WorldEvents';
import { JobType, SurfaceJob } from '../../../model/job/Job';
import { GameState } from '../../../model/GameState';
import { Raider } from '../../../../scene/model/Raider';
import { VehicleEntity } from '../../../../scene/model/VehicleEntity';
import { BuildingEntity } from '../../../../scene/model/BuildingEntity';
import { Surface } from '../../../../scene/model/map/Surface';

export class MainPanel extends IconPanel {

    constructor() {
        super();
        this.mainPanel = this.addSubPanel(4);
        const buildingPanel = this.addSubPanel(10);
        const smallVehiclePanel = this.addSubPanel(6);
        const largeVehiclePanel = this.addSubPanel(5);
        const selectWallPanel = this.addSubPanel(4);
        const selectFloorPanel = this.addSubPanel(3);
        const selectBuildingPanel = this.addSubPanel(4);
        const selectRaiderPanel = this.addSubPanel(10);
        const selectVehiclePanel = this.addSubPanel(7);
        const teleportItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TeleportMan');
        teleportItem.disabled = false;
        teleportItem.onClick = () => EventBus.publishEvent(new SpawnEvent(SpawnType.RAIDER));
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
            if (!selectedSurface.job || selectedSurface.job.type !== JobType.DRILL) {
                if (selectedSurface.job && selectedSurface.job.type !== JobType.DRILL) {
                    EventBus.publishEvent(new JobDeleteEvent(selectedSurface.job));
                }
                selectedSurface.job = new SurfaceJob(JobType.DRILL, selectedSurface);
                EventBus.publishEvent(new JobCreateEvent(selectedSurface.job));
            }
            EventBus.publishEvent(new SurfaceDeselectEvent());
        };
        const itemReinforce = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Reinforce');
        // itemReinforce.onClick = () => { // TODO implement reinforcements
        //     const selectedSurface = GameState.selectedEntities[0] as Surface;
        //     if (!selectedSurface.job) {
        //         EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(JobType.REINFORCE, selectedSurface)));
        //     }
        //     EventBus.publishEvent(new SurfaceDeselectEvent());
        // };
        const itemDynamite = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dynamite');
        // itemDynamite.onClick = () => { // TODO implement dynamite
        //     const selectedSurface = GameState.selectedEntities[0] as Surface;
        //     EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(JobType.BLOW, selectedSurface)));
        //     EventBus.publishEvent(new SpawnEvent(SpawnType.DYNAMITE));
        //     EventBus.publishEvent(new SurfaceDeselectEvent());
        // };
        const itemDeselect = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig');
        itemDeselect.disabled = false;
        itemDeselect.onClick = () => EventBus.publishEvent(new SurfaceDeselectEvent());
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, (event: SurfaceSelectedEvent) => {
            const type = event.surface.surfaceType;
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
        EventBus.registerEventListener(BuildingSelected.eventKey, () => this.selectSubPanel(selectBuildingPanel));
        EventBus.registerEventListener(BuildingDeselected.eventKey, () => this.selectSubPanel(this.mainPanel));
        selectBuildingPanel.backBtn.onClick = () => {
            GameState.selectedEntities.forEach((entity: BuildingEntity) => {
                EventBus.publishEvent(new BuildingDeselected(entity));
            });
        };
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair');
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PowerOff'); // TODO other option is Interface_MenuItem_PowerOn
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding');
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding');
        EventBus.registerEventListener(RaiderSelected.eventKey, () => this.selectSubPanel(selectRaiderPanel));
        EventBus.registerEventListener(RaiderDeselected.eventKey, () => this.selectSubPanel(this.mainPanel));
        selectRaiderPanel.backBtn.onClick = () => {
            GameState.selectedEntities.forEach((entity: Raider) => {
                EventBus.publishEvent(new RaiderDeselected(entity));
            });
        };
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
        EventBus.registerEventListener(VehicleDeselected.eventKey, () => this.selectSubPanel(this.mainPanel));
        selectVehiclePanel.backBtn.onClick = () => {
            GameState.selectedEntities.forEach((entity: VehicleEntity) => {
                EventBus.publishEvent(new VehicleDeselected(entity));
            });
        };
    }

}
