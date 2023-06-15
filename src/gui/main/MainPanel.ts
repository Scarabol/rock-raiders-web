import { EventKey } from '../../event/EventKeyEnum'
import { ChangeRaiderSpawnRequest } from '../../event/GuiCommand'
import { BuildingsChangedEvent, RaidersAmountChangedEvent, SelectionChanged, SelectPanelType } from '../../event/LocalEvents'
import { RequestedRaidersChanged } from '../../event/WorldEvents'
import { EntityType } from '../../game/model/EntityType'
import { MAX_RAIDER_REQUEST } from '../../params'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { BuildingPanel } from './BuildingPanel'
import { GetToolPanel } from './GetToolPanel'
import { IconPanelButtonLabel } from './IconPanelButtonLabel'
import { IconSubPanel } from './IconSubPanel'
import { SelectBuildingPanel } from './select/SelectBuildingPanel'
import { SelectFencePanel } from './select/SelectFencePanel'
import { SelectFloorPanel } from './select/SelectFloorPanel'
import { SelectLavaErosionPanel } from './select/SelectLavaErosionPanel'
import { SelectRaiderPanel } from './select/SelectRaiderPanel'
import { SelectRubblePanel } from './select/SelectRubblePanel'
import { SelectSitePanel } from './select/SelectSitePanel'
import { SelectVehicleEmptyPanel } from './select/SelectVehicleEmptyPanel'
import { SelectVehicleManedPanel } from './select/SelectVehicleManedPanel'
import { SelectWallPanel } from './select/SelectWallPanel'
import { TrainRaiderPanel } from './TrainRaiderPanel'
import { LargeVehiclePanel, SmallVehiclePanel } from './VehiclePanel'
import { UpgradeVehiclePanel } from './UpgradeVehiclePanel'
import { ResourceManager } from '../../resource/ResourceManager'

export class MainPanel extends Panel {
    subPanels: IconSubPanel[] = []
    mainPanel: IconSubPanel // don't use root itself, since sub panel must be decoupled from (animated) main panel position
    selectWallPanel: SelectWallPanel
    selectFloorPanel: SelectFloorPanel
    selectRubblePanel: SelectRubblePanel
    selectSitePanel: SelectSitePanel
    selectLavaErosionPanel: SelectLavaErosionPanel

    numRequestedRaiders: number = 0
    hasRaiderTeleport: boolean = false
    hasMaxRaiders: boolean = false

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
        this.selectLavaErosionPanel = this.addSubPanel(new SelectLavaErosionPanel(this, this.mainPanel))
        const selectBuildingPanel = this.addSubPanel(new SelectBuildingPanel(this, this.mainPanel))
        const selectRaiderPanel = this.addSubPanel(new SelectRaiderPanel(this, this.mainPanel))
        const trainRaiderPanel = this.addSubPanel(new TrainRaiderPanel(this, selectRaiderPanel))
        selectRaiderPanel.trainItem.onClick = () => selectRaiderPanel.toggleState(() => trainRaiderPanel.toggleState())
        const getToolPanel = this.addSubPanel(new GetToolPanel(this, selectRaiderPanel))
        selectRaiderPanel.getToolItem.onClick = () => selectRaiderPanel.toggleState(() => getToolPanel.toggleState())
        const selectVehicleEmptyPanel = this.addSubPanel(new SelectVehicleEmptyPanel(this, this.mainPanel))
        const selectVehicleManedPanel = this.addSubPanel(new SelectVehicleManedPanel(this, this.mainPanel))
        const upgradeVehiclePanel = this.addSubPanel(new UpgradeVehiclePanel(this, selectVehicleManedPanel))
        selectVehicleManedPanel.upgradeItem.onClick = () => selectVehicleManedPanel.toggleState(() => upgradeVehiclePanel.toggleState())
        const selectFencePanel = this.addSubPanel(new SelectFencePanel(this, this.mainPanel))

        const teleportRaider = this.mainPanel.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_TeleportMan')
        teleportRaider.isDisabled = () => this.hasMaxRaiders || this.numRequestedRaiders >= MAX_RAIDER_REQUEST || !this.hasRaiderTeleport
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
        const buildingItem = this.mainPanel.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_BuildBuilding')
        buildingItem.isDisabled = () => false
        buildingItem.onClick = () => this.mainPanel.toggleState(() => buildingPanel.toggleState())
        const smallVehicleItem = this.mainPanel.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_BuildSmallVehicle')
        smallVehicleItem.isDisabled = () => false
        smallVehicleItem.onClick = () => this.mainPanel.toggleState(() => smallVehiclePanel.toggleState())
        const largeVehicleItem = this.mainPanel.addMenuItem(ResourceManager.configuration.interfaceImages, 'Interface_MenuItem_BuildLargeVehicle')
        largeVehicleItem.isDisabled = () => false
        largeVehicleItem.onClick = () => this.mainPanel.toggleState(() => largeVehiclePanel.toggleState())

        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            if (event.selectPanelType === SelectPanelType.RAIDER) this.selectSubPanel(selectRaiderPanel)
            else if (event.selectPanelType === SelectPanelType.VEHICLE) this.selectSubPanel(event.noVehicleWithDriver ? selectVehicleEmptyPanel : selectVehicleManedPanel)
            else if (event.selectPanelType === SelectPanelType.BUILDING) this.selectSubPanel(selectBuildingPanel)
            else if (event.selectPanelType === SelectPanelType.SURFACE) this.onSelectedSurfaceChange(event.isFloor, event.hasRubble, event.isSite, event.isLava)
            else if (event.selectPanelType === SelectPanelType.FENCE) this.selectSubPanel(selectFencePanel)
            else this.selectSubPanel(this.mainPanel)
        })
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.hasRaiderTeleport = BuildingsChangedEvent.hasUsable(event, EntityType.TOOLSTATION)
                || BuildingsChangedEvent.hasUsable(event, EntityType.TELEPORT_PAD)
            teleportRaider.updateState()
        })
        this.registerEventListener(EventKey.RAIDER_AMOUNT_CHANGED, (event: RaidersAmountChangedEvent) => {
            this.hasMaxRaiders = event.hasMaxRaiders
            teleportRaider.updateState()
        })
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
        this.hasRaiderTeleport = false
        this.hasMaxRaiders = false
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

    onSelectedSurfaceChange(isFloor: boolean, hasRubble: boolean, isSite: boolean, isLava: boolean) {
        if (isFloor) {
            if (hasRubble) {
                this.selectSubPanel(this.selectRubblePanel)
            } else if (isLava) {
                this.selectSubPanel(this.selectLavaErosionPanel)
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
