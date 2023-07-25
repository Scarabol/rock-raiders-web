import { EventKey } from '../../event/EventKeyEnum'
import { RequestVehicleSpawn } from '../../event/GuiCommand'
import { RequestedVehiclesChanged } from '../../event/WorldEvents'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconPanelButtonLabel } from './IconPanelButtonLabel'
import { Sample } from '../../audio/Sample'
import { IconSubPanel } from './IconSubPanel'
import { ResourceManager } from '../../resource/ResourceManager'

abstract class VehiclePanel extends IconSubPanel {
    requestedVehiclesByType: Map<EntityType, number> = new Map()
    btnLabelByType: Map<EntityType, IconPanelButtonLabel> = new Map()

    protected constructor(parent: BaseElement, numOfItems: number, onBackPanel: Panel) {
        super(parent, numOfItems, onBackPanel)
        this.registerEventListener(EventKey.REQUESTED_VEHICLES_CHANGED, (event: RequestedVehiclesChanged) => {
            this.requestedVehiclesByType.set(event.vehicle, event.numRequested)
            this.btnLabelByType.get(event.vehicle)?.setLabel(event.numRequested)
        })
    }

    addVehicleMenuItem(itemKey: string, entityType: EntityType, tooltipSfx: Sample) {
        const item = super.addMenuItem(ResourceManager.configuration.interfaceBuildImages, itemKey)
        item.isDisabled = () => item.hasUnfulfilledDependency
        item.onClick = () => this.publishEvent(new RequestVehicleSpawn(entityType, this.requestedVehiclesByType.getOrDefault(entityType, 0) + 1))
        item.onClickSecondary = () => {
            const numRequested = this.requestedVehiclesByType.getOrDefault(entityType, 0)
            if (numRequested > 0) this.publishEvent(new RequestVehicleSpawn(entityType, numRequested - 1))
        }
        item.tooltip = ResourceManager.configuration.objectNamesCfg.get(itemKey.toLowerCase())
        item.tooltipSfx = Sample[tooltipSfx]
        item.tooltipDisabled = item.tooltip
        item.tooltipDisabledSfx = item.tooltipSfx
        this.btnLabelByType.set(entityType, item.addChild(new IconPanelButtonLabel(item)))
    }
}

export class SmallVehiclePanel extends VehiclePanel {
    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 6, onBackPanel)
        this.addVehicleMenuItem('Hoverboard', EntityType.HOVERBOARD, Sample.ObjSFX_Hoverboard)
        this.addVehicleMenuItem('SmallDigger', EntityType.SMALL_DIGGER, Sample.ObjSFX_SmallDigger)
        this.addVehicleMenuItem('SmallTruck', EntityType.SMALL_TRUCK, Sample.ObjSFX_SmallTruck)
        this.addVehicleMenuItem('SmallCat', EntityType.SMALL_CAT, Sample.ObjSFX_SmallCat)
        this.addVehicleMenuItem('SmallMLP', EntityType.SMALL_MLP, Sample.ObjSFX_SmallMLP)
        this.addVehicleMenuItem('SmallHeli', EntityType.SMALL_HELI, Sample.ObjSFX_SmallHeli)
    }
}

export class LargeVehiclePanel extends VehiclePanel {
    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 5, onBackPanel)
        this.addVehicleMenuItem('BullDozer', EntityType.BULLDOZER, Sample.ObjSFX_BullDozer)
        this.addVehicleMenuItem('WalkerDigger', EntityType.WALKER_DIGGER, Sample.ObjSFX_WalkerDigger)
        this.addVehicleMenuItem('LargeMLP', EntityType.LARGE_MLP, Sample.ObjSFX_LargeMLP)
        this.addVehicleMenuItem('LargeDigger', EntityType.LARGE_DIGGER, Sample.ObjSFX_LargeDigger)
        this.addVehicleMenuItem('LargeCat', EntityType.LARGE_CAT, Sample.ObjSFX_LargeCat)
    }
}
