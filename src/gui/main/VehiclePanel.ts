import { EventKey } from '../../event/EventKeyEnum'
import { RequestedVehiclesChanged } from '../../event/WorldEvents'
import { EntityType } from '../../game/model/EntityType'
import { Panel } from '../base/Panel'
import { IconPanelButtonLabel } from './IconPanelButtonLabel'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'

abstract class VehiclePanel extends IconSubPanel {
    requestedVehiclesByType: Map<EntityType, number> = new Map()
    btnLabelByType: Map<EntityType, IconPanelButtonLabel> = new Map()

    protected constructor(numOfItems: number, onBackPanel: Panel) {
        super(numOfItems, onBackPanel)
        this.registerEventListener(EventKey.REQUESTED_VEHICLES_CHANGED, (event: RequestedVehiclesChanged) => {
            this.requestedVehiclesByType.set(event.vehicle, event.numRequested)
            this.btnLabelByType.get(event.vehicle)?.setLabel(event.numRequested)
        })
    }

    addVehicleMenuItem(entityType: EntityType) {
        const item = super.addMenuItem(GameConfig.instance.interfaceBuildImages, entityType.toLowerCase())
        item.isDisabled = () => item.hasUnfulfilledDependency
        item.onClick = () => this.publishEvent(new RequestedVehiclesChanged(entityType, this.requestedVehiclesByType.getOrUpdate(entityType, () => 0) + 1))
        item.tooltip = GameConfig.instance.objectNamesCfg.get(entityType.toLowerCase())
        if (!item.tooltip) console.warn(`Could not determine tooltip for ${entityType}`)
        item.tooltipSfx = GameConfig.instance.objTtSFXs.get(entityType.toLowerCase())
        if (!item.tooltipSfx) console.warn(`Could not determine tooltip SFX for ${entityType}`)
        item.tooltipDisabled = item.tooltip
        item.tooltipDisabledSfx = item.tooltipSfx
        this.btnLabelByType.set(entityType, item.addChild(new IconPanelButtonLabel()))
    }
}

export class SmallVehiclePanel extends VehiclePanel {
    constructor(onBackPanel: Panel) {
        super(6, onBackPanel)
        this.addVehicleMenuItem(EntityType.HOVERBOARD)
        this.addVehicleMenuItem(EntityType.SMALL_DIGGER)
        this.addVehicleMenuItem(EntityType.SMALL_TRUCK)
        this.addVehicleMenuItem(EntityType.SMALL_CAT)
        this.addVehicleMenuItem(EntityType.SMALL_MLP)
        this.addVehicleMenuItem(EntityType.SMALL_HELI)
    }
}

export class LargeVehiclePanel extends VehiclePanel {
    constructor(onBackPanel: Panel) {
        super(5, onBackPanel)
        this.addVehicleMenuItem(EntityType.BULLDOZER)
        this.addVehicleMenuItem(EntityType.WALKER_DIGGER)
        this.addVehicleMenuItem(EntityType.LARGE_MLP)
        this.addVehicleMenuItem(EntityType.LARGE_DIGGER)
        this.addVehicleMenuItem(EntityType.LARGE_CAT)
    }
}
