import { EventKey } from '../../event/EventKeyEnum'
import { ChangeRaiderSpawnRequest } from '../../event/GuiCommand'
import { BuildingsChangedEvent, RaidersChangedEvent, SelectionChanged, SelectPanelType } from '../../event/LocalEvents'
import { RequestedRaidersChanged } from '../../event/WorldEvents'
import { EntityType } from '../../game/model/EntityType'
import { ADDITIONAL_RAIDER_PER_SUPPORT, MAX_RAIDER_BASE, MAX_RAIDER_REQUEST } from '../../params'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { BuildingPanel } from './BuildingPanel'
import { GetToolPanel } from './GetToolPanel'
import { IconPanelButtonLabel } from './IconPanelButtonLabel'
import { IconSubPanel } from './IconSubPanel'
import { SelectBuildingPanel } from './select/SelectBuildingPanel'
import { SelectFencePanel } from './select/SelectFencePanel'
import { SelectFloorPanel } from './select/SelectFloorPanel'
import { SelectRaiderPanel } from './select/SelectRaiderPanel'
import { SelectRubblePanel } from './select/SelectRubblePanel'
import { SelectSitePanel } from './select/SelectSitePanel'
import { SelectVehicleEmptyPanel } from './select/SelectVehicleEmptyPanel'
import { SelectVehicleManedPanel } from './select/SelectVehicleManedPanel'
import { SelectWallPanel } from './select/SelectWallPanel'
import { TrainRaiderPanel } from './TrainRaiderPanel'
import { LargeVehiclePanel, SmallVehiclePanel } from './VehiclePanel'

export class MainPanel extends Panel {
    subPanels: IconSubPanel[] = []
    mainPanel: IconSubPanel // don't use root itself, since sub panel must be decoupled from (animated) main panel position
    selectWallPanel: SelectWallPanel
    selectFloorPanel: SelectFloorPanel
    selectRubblePanel: SelectRubblePanel
    selectSitePanel: SelectSitePanel

    numRequestedRaiders: number = 0
    numToolstations: number = 0
    numTeleportPads: number = 0
    numBarracks: number = 0
    numRaiders: number = 0

    constructor(parent: BaseElement) {
        super(parent)
        this.relX = this.xOut = 640 - 16
        this.xIn = 640 + 95
        this.relY = this.yOut = this.yIn = 9
        this.movedIn = false
        this.mainPanel = this.addSubPanel(new IconSubPanel(this, 4))
        this.mainPanel.relX = this.mainPanel.xOut
        this.mainPanel.relY = this.mainPanel.yOut
        this.mainPanel.movedIn = false

        const buildingPanel = this.addSubPanel(new BuildingPanel(this, this.mainPanel))
        const smallVehiclePanel = this.addSubPanel(new SmallVehiclePanel(this, this.mainPanel))
        const largeVehiclePanel = this.addSubPanel(new LargeVehiclePanel(this, this.mainPanel))
        this.selectWallPanel = this.addSubPanel(new SelectWallPanel(this, this.mainPanel))
        this.selectFloorPanel = this.addSubPanel(new SelectFloorPanel(this, this.mainPanel))
        this.selectRubblePanel = this.addSubPanel(new SelectRubblePanel(this, this.mainPanel))
        this.selectSitePanel = this.addSubPanel(new SelectSitePanel(this, this.mainPanel))
        const selectBuildingPanel = this.addSubPanel(new SelectBuildingPanel(this, this.mainPanel))
        const selectRaiderPanel = this.addSubPanel(new SelectRaiderPanel(this, this.mainPanel))
        const trainRaiderPanel = this.addSubPanel(new TrainRaiderPanel(this, selectRaiderPanel))
        selectRaiderPanel.trainItem.onClick = () => selectRaiderPanel.toggleState(() => trainRaiderPanel.toggleState())
        const getToolPanel = this.addSubPanel(new GetToolPanel(this, selectRaiderPanel))
        selectRaiderPanel.getToolItem.onClick = () => selectRaiderPanel.toggleState(() => getToolPanel.toggleState())
        const selectVehicleEmptyPanel = this.addSubPanel(new SelectVehicleEmptyPanel(this, this.mainPanel))
        const selectVehicleManedPanel = this.addSubPanel(new SelectVehicleManedPanel(this, this.mainPanel))
        const selectFencePanel = this.addSubPanel(new SelectFencePanel(this, this.mainPanel))

        const teleportRaider = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TeleportMan')
        teleportRaider.isDisabled = () => this.numRaiders >= this.getMaxRaiders() || this.numRequestedRaiders >= MAX_RAIDER_REQUEST ||
            (this.numToolstations < 1 && this.numTeleportPads < 1)
        teleportRaider.updateState()
        teleportRaider.onClick = () => this.publishEvent(new ChangeRaiderSpawnRequest(true))
        teleportRaider.onClickSecondary = () => {
            if (this.numRequestedRaiders > 0) this.publishEvent(new ChangeRaiderSpawnRequest(false))
        }
        const requestedRaiderLabel = teleportRaider.addChild(new IconPanelButtonLabel(teleportRaider))
        requestedRaiderLabel.registerEventListener(EventKey.REQUESTED_RAIDERS_CHANGED, (event: RequestedRaidersChanged) => {
            requestedRaiderLabel.setLabel(event.numRequested)
        })
        this.registerEventListener(EventKey.REQUESTED_RAIDERS_CHANGED, (event: RequestedRaidersChanged) => {
            this.numRequestedRaiders = event.numRequested
            teleportRaider.updateState()
        })
        const buildingItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildBuilding')
        buildingItem.isDisabled = () => false
        buildingItem.onClick = () => this.mainPanel.toggleState(() => buildingPanel.toggleState())
        const smallVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildSmallVehicle')
        smallVehicleItem.isDisabled = () => false
        smallVehicleItem.onClick = () => this.mainPanel.toggleState(() => smallVehiclePanel.toggleState())
        const largeVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildLargeVehicle')
        largeVehicleItem.isDisabled = () => false
        largeVehicleItem.onClick = () => this.mainPanel.toggleState(() => largeVehiclePanel.toggleState())

        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            if (event.selectPanelType === SelectPanelType.RAIDER) this.selectSubPanel(selectRaiderPanel)
            else if (event.selectPanelType === SelectPanelType.VEHICLE) this.selectSubPanel(event.noVehicleWithDriver ? selectVehicleEmptyPanel : selectVehicleManedPanel)
            else if (event.selectPanelType === SelectPanelType.BUILDING) this.selectSubPanel(selectBuildingPanel)
            else if (event.selectPanelType === SelectPanelType.SURFACE) this.onSelectedSurfaceChange(event.isFloor, event.isSite, event.hasRubble)
            else if (event.selectPanelType === SelectPanelType.FENCE) this.selectSubPanel(selectFencePanel)
            else this.selectSubPanel(this.mainPanel)
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.numToolstations = BuildingsChangedEvent.countUsable(event, EntityType.TOOLSTATION)
            this.numTeleportPads = BuildingsChangedEvent.countUsable(event, EntityType.TELEPORT_PAD)
            this.numBarracks = BuildingsChangedEvent.countUsable(event, EntityType.BARRACKS)
            teleportRaider.updateState()
        })
        this.registerEventListener(EventKey.RAIDERS_CHANGED, (event: RaidersChangedEvent) => {
            this.numRaiders = event.numRaiders
            teleportRaider.updateState()
        })
    }

    getMaxRaiders(): number {
        return MAX_RAIDER_BASE + this.numBarracks * ADDITIONAL_RAIDER_PER_SUPPORT
    }

    reset() {
        super.reset()
        this.relX = this.xOut
        this.relY = this.yOut
        this.movedIn = false
        this.updatePosition()
        this.mainPanel.relX = this.mainPanel.xOut
        this.mainPanel.relY = this.mainPanel.yOut
        this.mainPanel.movedIn = false
        this.mainPanel.updatePosition()
        this.numRequestedRaiders = 0
        this.numToolstations = 0
        this.numTeleportPads = 0
        this.numBarracks = 0
        this.numRaiders = 0
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

    onSelectedSurfaceChange(isFloor: boolean, isSite: boolean, hasRubble: boolean) {
        if (isFloor) {
            if (hasRubble) {
                this.selectSubPanel(this.selectRubblePanel)
            } else if (isSite) {
                this.selectSubPanel(this.selectSitePanel)
            } else {
                this.selectSubPanel(this.selectFloorPanel)
            }
        } else {
            this.selectSubPanel(this.selectWallPanel)
        }
    }
}
