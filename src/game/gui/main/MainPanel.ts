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
import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'
import { TrainRaiderPanel } from './TrainRaiderPanel'
import { GetToolPanel } from './GetToolPanel'
import { IconPanelButtonLabel } from './IconPanelButtonLabel'

export class MainPanel extends Panel {

    subPanels: IconSubPanel[] = []
    mainPanel: IconSubPanel // don't use root itself, since sub panel must be decoupled from (animated) main panel position

    constructor() {
        super()
        this.relX = this.xOut = 640 - 16
        this.xIn = 640 + 95
        this.relY = this.yOut = this.yIn = 9
        this.movedIn = false
        this.mainPanel = this.addSubPanel(new IconSubPanel(4))
        this.mainPanel.relX = this.mainPanel.xOut
        this.mainPanel.relY = this.mainPanel.yOut
        this.mainPanel.movedIn = false

        const buildingPanel = this.addSubPanel(new BuildingPanel(this.mainPanel))
        const smallVehiclePanel = this.addSubPanel(new SmallVehiclePanel(this.mainPanel))
        const largeVehiclePanel = this.addSubPanel(new LargeVehiclePanel(this.mainPanel))
        const selectWallPanel = this.addSubPanel(new SelectWallPanel(this.mainPanel))
        const selectFloorPanel = this.addSubPanel(new SelectFloorPanel(this.mainPanel))
        const selectRubblePanel = this.addSubPanel(new SelectRubblePanel(this.mainPanel))
        const selectBuildingPanel = this.addSubPanel(new SelectBuildingPanel(this.mainPanel))
        const selectRaiderPanel = this.addSubPanel(new SelectRaiderPanel(this.mainPanel))
        const trainRaiderPanel = this.addSubPanel(new TrainRaiderPanel(selectRaiderPanel))
        selectRaiderPanel.trainItem.onClick = () => selectRaiderPanel.toggleState(() => trainRaiderPanel.toggleState())
        const getToolPanel = this.addSubPanel(new GetToolPanel(selectRaiderPanel))
        selectRaiderPanel.getToolItem.onClick = () => selectRaiderPanel.toggleState(() => getToolPanel.toggleState())
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
        // TODO add decrease requested raider spawn option (needs right click for gui elements)
        teleportRaider.addChild(new IconPanelButtonLabel(teleportRaider))
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

    addSubPanel<T extends IconSubPanel>(childPanel: T): T {
        this.addChild(childPanel)
        this.subPanels.push(childPanel)
        return childPanel
    }

    selectSubPanel(targetPanel: IconSubPanel) {
        this.subPanels.forEach((subPanel) => subPanel !== targetPanel && subPanel.setMovedIn(true))
        targetPanel.setMovedIn(false)
    }

}
