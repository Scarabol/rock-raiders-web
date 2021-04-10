import { IconPanel } from './IconPanel'
import { EventBus } from '../../../event/EventBus'
import { BuildingSelected, EntityDeselected, RaiderSelected, SurfaceSelectedEvent, VehicleSelected } from '../../../event/LocalEvents'
import { CollectEvent, EntityAddedEvent, EntityRemovedEvent, EntityType, JobCreateEvent, RaiderRequested, SpawnDynamiteEvent, SpawnMaterialEvent } from '../../../event/WorldEvents'
import { GameState } from '../../model/GameState'
import { Surface } from '../../../scene/model/map/Surface'
import { Building } from '../../model/entity/building/Building'
import { SurfaceJob, SurfaceJobType } from '../../model/job/SurfaceJob'
import { SurfaceType } from '../../../scene/model/map/SurfaceType'
import { CollectableType } from '../../../scene/model/collect/CollectableEntity'
import { BuildingSite } from '../../../scene/model/BuildingSite'
import { BuildingEntity } from '../../../scene/model/BuildingEntity'

export class MainPanel extends IconPanel {

    // TODO refactor menu item handling and classes

    constructor() {
        super()
        EventBus.registerEventListener(EntityDeselected.eventKey, () => this.selectSubPanel(this.mainPanel))
        const buildingPanel = this.addSubPanel(10)
        const smallVehiclePanel = this.addSubPanel(6)
        const largeVehiclePanel = this.addSubPanel(5)
        const selectWallPanel = this.addSubPanel(4)
        const selectFloorPanel = this.addSubPanel(3)
        const selectRubblePanel = this.addSubPanel(2)
        const selectBuildingPanel = this.addSubPanel(4)
        const selectRaiderPanel = this.addSubPanel(10)
        const selectVehiclePanel = this.addSubPanel(7)
        const teleportRaider = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TeleportMan')
        teleportRaider.disabled = GameState.getBuildingsByType(Building.TOOLSTATION, Building.TELEPORT_PAD).length < 1
            || GameState.raiders.length >= GameState.getMaxRaiders()
        EventBus.registerEventListener(EntityAddedEvent.eventKey, (event: EntityAddedEvent) => {
            if (event.type === EntityType.BUILDING || event.type === EntityType.RAIDER) {
                teleportRaider.disabled = GameState.getBuildingsByType(Building.TOOLSTATION, Building.TELEPORT_PAD).length < 1
                    || GameState.raiders.length >= GameState.getMaxRaiders()
                this.notifyRedraw()
            }
        })
        EventBus.registerEventListener(EntityRemovedEvent.eventKey, (event: EntityRemovedEvent) => {
            if (event.type === EntityType.BUILDING || event.type === EntityType.RAIDER) {
                teleportRaider.disabled = GameState.getBuildingsByType(Building.TOOLSTATION, Building.TELEPORT_PAD).length < 1
                    || GameState.raiders.length >= GameState.getMaxRaiders()
                this.notifyRedraw()
            }
        })
        teleportRaider.onClick = () => EventBus.publishEvent(new RaiderRequested(GameState.requestedRaiders + 1))
        // TODO add decrease requested raider spawn option
        const buildingItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildBuilding')
        buildingItem.disabled = false
        buildingItem.onClick = () => this.mainPanel.toggleState(() => buildingPanel.toggleState())
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Toolstation')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'TeleportPad')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Docks')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Powerstation')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Barracks')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Upgrade')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Geo-dome')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'OreRefinery')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'Gunstation')
        buildingPanel.addMenuItem('InterfaceBuildImages', 'TeleportBIG')
        const smallVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildSmallVehicle')
        smallVehicleItem.disabled = false
        smallVehicleItem.onClick = () => this.mainPanel.toggleState(() => smallVehiclePanel.toggleState())
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'Hoverboard')
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallDigger')
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallTruck')
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallCat')
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallMLP')
        smallVehiclePanel.addMenuItem('InterfaceBuildImages', 'SmallHeli')
        const largeVehicleItem = this.mainPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_BuildLargeVehicle')
        largeVehicleItem.disabled = false
        largeVehicleItem.onClick = () => this.mainPanel.toggleState(() => largeVehiclePanel.toggleState())
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'BullDozer')
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'WalkerDigger')
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeMLP')
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeDigger')
        largeVehiclePanel.addMenuItem('InterfaceBuildImages', 'LargeCat')
        const itemDrill = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dig')
        itemDrill.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            if (!selectedSurface.hasJobType(SurfaceJobType.DRILL)) {
                EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.DRILL, selectedSurface)))
            }
            EventBus.publishEvent(new EntityDeselected())
        }
        const itemReinforce = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Reinforce')
        itemReinforce.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            if (!selectedSurface.hasJobType(SurfaceJobType.REINFORCE)) {
                EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.REINFORCE, selectedSurface)))
            }
            EventBus.publishEvent(new EntityDeselected())
        }
        const itemDynamite = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Dynamite')
        itemDynamite.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            if (!selectedSurface.hasJobType(SurfaceJobType.BLOW)) {
                EventBus.publishEvent(new SpawnDynamiteEvent(selectedSurface))
            }
            EventBus.publishEvent(new EntityDeselected())
        }
        const itemDeselect = selectWallPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeselectDig')
        itemDeselect.disabled = false
        itemDeselect.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            selectedSurface.cancelJobs()
            EventBus.publishEvent(new EntityDeselected())
        }
        selectWallPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
        selectFloorPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
        const pathItem = selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_LayPath')
        pathItem.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            selectedSurface.surfaceType = SurfaceType.POWER_PATH_SITE
            selectedSurface.updateTexture()
            const targetBuilding = GameState.getClosestBuildingByType(selectedSurface.getCenterWorld(), Building.TOOLSTATION)
            if (targetBuilding) {
                const ores = GameState.dropMaterial(CollectableType.ORE, 2)
                ores.forEach((ore) => {
                    EventBus.publishEvent(new SpawnMaterialEvent(ore, targetBuilding.getDropPosition())) // TODO use ToolNullName from cfg
                })
            }
            const site = new BuildingSite(true)
            site.surfaces.push(selectedSurface)
            site.neededByType[CollectableType.ORE] = 2
            GameState.buildingSites.push(site)
            EventBus.publishEvent(new EntityDeselected())
        }
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_RemovePath')
        selectFloorPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        selectRubblePanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
        const clearRubbleItem = selectRubblePanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_ClearRubble')
        clearRubbleItem.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            EventBus.publishEvent(new JobCreateEvent(new SurfaceJob(SurfaceJobType.CLEAR_RUBBLE, selectedSurface)))
            EventBus.publishEvent(new EntityDeselected())
        }
        selectRubblePanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, (event: SurfaceSelectedEvent) => {
            const surface = event.surface
            if (surface.surfaceType.floor) {
                if (surface.hasRubble()) {
                    clearRubbleItem.disabled = !event.surface.hasRubble()
                    this.selectSubPanel(selectRubblePanel)
                } else {
                    pathItem.disabled = event.surface.hasRubble()
                    this.selectSubPanel(selectFloorPanel)
                }
            } else {
                this.selectSubPanel(selectWallPanel)
                itemDrill.disabled = !surface.isDrillable()
                itemReinforce.disabled = !surface.isReinforcable()
                itemDynamite.disabled = !surface.isExplodable()
                this.notifyRedraw()
            }
        })
        EventBus.registerEventListener(BuildingSelected.eventKey, () => this.selectSubPanel(selectBuildingPanel))
        selectBuildingPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_Repair')
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_PowerOff') // TODO other option is Interface_MenuItem_PowerOn
        const upgradeItem = selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeBuilding')
        upgradeItem.disabled = false // TODO actually could use correct check, but state is not updated, when panel is moved in
        EventBus.registerEventListener(CollectEvent.eventKey, () => {
            upgradeItem.disabled = GameState.numOre < 5 || GameState.selectedEntities.length < 1 || (GameState.selectedEntities[0] as BuildingEntity).hasMaxUpgrades()
            this.notifyRedraw()
        })
        EventBus.registerEventListener(SpawnMaterialEvent.eventKey, () => {
            upgradeItem.disabled = GameState.numOre < 5 || GameState.selectedEntities.length < 1 || (GameState.selectedEntities[0] as BuildingEntity).hasMaxUpgrades()
            this.notifyRedraw()
        })
        upgradeItem.onClick = () => {
            (GameState.selectedEntities[0] as BuildingEntity).upgrade()
            EventBus.publishEvent(new EntityDeselected())
        }
        selectBuildingPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteBuilding')
        EventBus.registerEventListener(RaiderSelected.eventKey, () => this.selectSubPanel(selectRaiderPanel))
        selectRaiderPanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GoFeed')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_UnLoadMinifigure')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_MinifigurePickUp')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GetTool')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DropBirdScarer')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_UpgradeMan')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_TrainSkill')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoFirstPerson')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_GotoSecondPerson')
        selectRaiderPanel.addMenuItem('InterfaceImages', 'Interface_MenuItem_DeleteMan')
        EventBus.registerEventListener(VehicleSelected.eventKey, () => this.selectSubPanel(selectVehiclePanel))
        selectVehiclePanel.backBtn.onClick = () => EventBus.publishEvent(new EntityDeselected())
    }

}
