import { IconPanel } from './IconPanel'
import { EventBus } from '../../../event/EventBus'
import { BuildingSelected, EntityDeselected, RaiderSelected, SurfaceSelectedEvent, VehicleSelected } from '../../../event/LocalEvents'
import { EntityAddedEvent, EntityRemovedEvent, EntityType, RaiderRequested } from '../../../event/WorldEvents'
import { GameState } from '../../model/GameState'
import { Building } from '../../model/entity/building/Building'
import { BuildingPanel } from './BuildingPanel'
import { SmallVehiclePanel } from './SmallVehiclePanel'
import { LargeVehiclePanel } from './LargeVehiclePanel'
import { SelectWallPanel } from './SelectWallPanel'
import { SelectFloorPanel } from './SelectFloorPanel'
import { SelectRubblePanel } from './SelectRubblePanel'
import { SelectBuildingPanel } from './SelectBuildingPanel'
import { SelectRaiderPanel } from './SelectRaiderPanel'
import { SelectVehiclePanel } from './SelectVehiclePanel'

export class MainPanel extends IconPanel {

    constructor() {
        super()
        const buildingPanel = this.addSubPanel(new BuildingPanel(this.mainPanel))
        const smallVehiclePanel = this.addSubPanel(new SmallVehiclePanel(this.mainPanel))
        const largeVehiclePanel = this.addSubPanel(new LargeVehiclePanel(this.mainPanel))
        const selectWallPanel = this.addSubPanel(new SelectWallPanel(this.mainPanel))
        const selectFloorPanel = this.addSubPanel(new SelectFloorPanel(this.mainPanel))
        const selectRubblePanel = this.addSubPanel(new SelectRubblePanel(this.mainPanel))
        const selectBuildingPanel = this.addSubPanel(new SelectBuildingPanel(this.mainPanel))
        const selectRaiderPanel = this.addSubPanel(new SelectRaiderPanel(this.mainPanel))
        const selectVehiclePanel = this.addSubPanel(new SelectVehiclePanel(this.mainPanel))
        const teleportRaider = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TeleportMan')
        teleportRaider.isDisabled = () => GameState.getBuildingsByType(Building.TOOLSTATION, Building.TELEPORT_PAD).length < 1
            || GameState.raiders.length >= GameState.getMaxRaiders()
        teleportRaider.updateState() // TODO auto call this for each button, when icon panel is shown
        EventBus.registerEventListener(EntityAddedEvent.eventKey, (event: EntityAddedEvent) => {
            // TODO add event inheritance by using event key prefix checking
            if (event.type === EntityType.BUILDING || event.type === EntityType.RAIDER) teleportRaider.updateState()
        })
        EventBus.registerEventListener(EntityRemovedEvent.eventKey, (event: EntityRemovedEvent) => {
            // TODO add event inheritance by using event key prefix checking
            if (event.type === EntityType.BUILDING || event.type === EntityType.RAIDER) teleportRaider.updateState()
        })
        teleportRaider.onClick = () => EventBus.publishEvent(new RaiderRequested(GameState.requestedRaiders + 1))
        // TODO add decrease requested raider spawn option
        const buildingItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildBuilding')
        buildingItem.disabled = false
        buildingItem.onClick = () => this.mainPanel.toggleState(() => buildingPanel.toggleState())
        const smallVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildSmallVehicle')
        smallVehicleItem.disabled = false
        smallVehicleItem.onClick = () => this.mainPanel.toggleState(() => smallVehiclePanel.toggleState())
        const largeVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildLargeVehicle')
        largeVehicleItem.disabled = false
        largeVehicleItem.onClick = () => this.mainPanel.toggleState(() => largeVehiclePanel.toggleState())
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, (event: SurfaceSelectedEvent) => {
            const surface = event.surface
            if (surface.surfaceType.floor) {
                if (surface.hasRubble()) {
                    this.selectSubPanel(selectRubblePanel)
                } else {
                    this.selectSubPanel(selectFloorPanel)
                }
            } else {
                this.selectSubPanel(selectWallPanel)
            }
        })
        EventBus.registerEventListener(EntityDeselected.eventKey, () => this.selectSubPanel(this.mainPanel))
        EventBus.registerEventListener(BuildingSelected.eventKey, () => this.selectSubPanel(selectBuildingPanel))
        EventBus.registerEventListener(RaiderSelected.eventKey, () => this.selectSubPanel(selectRaiderPanel))
        EventBus.registerEventListener(VehicleSelected.eventKey, () => this.selectSubPanel(selectVehiclePanel))
    }

}
