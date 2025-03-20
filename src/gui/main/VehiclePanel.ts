import { EventKey } from '../../event/EventKeyEnum'
import { RequestedVehiclesChanged } from '../../event/WorldEvents'
import { EntityType } from '../../game/model/EntityType'
import { Panel } from '../base/Panel'
import { IconPanelButtonLabel } from './IconPanelButtonLabel'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'
import { InterfaceBuildImage } from '../../cfg/InterfaceImageCfg'

export class VehiclePanel extends IconSubPanel {
    requestedVehiclesByType: Map<EntityType, number> = new Map()
    btnLabelByType: Map<EntityType, IconPanelButtonLabel> = new Map()

    constructor(numOfItems: number, readonly onBackPanel: Panel) {
        super(numOfItems, onBackPanel, false)
        this.registerEventListener(EventKey.REQUESTED_VEHICLES_CHANGED, (event: RequestedVehiclesChanged) => {
            this.requestedVehiclesByType.set(event.vehicle, event.numRequested)
            this.btnLabelByType.get(event.vehicle)?.setLabel(event.numRequested)
        })
    }

    addVehicleMenuItem(interfaceBuildImage: InterfaceBuildImage, entityType: EntityType) {
        const item = super.addMenuItem(GameConfig.instance.interfaceBuildImages[interfaceBuildImage])
        item.isDisabled = () => item.hasUnfulfilledDependency
        item.onClick = () => {
            this.toggleState(() => this.onBackPanel.toggleState())
            this.publishEvent(new RequestedVehiclesChanged(entityType, this.requestedVehiclesByType.getOrUpdate(entityType, () => 0) + 1))
        }
        item.tooltip = GameConfig.instance.objectNames[entityType.toLowerCase()]
        if (!item.tooltip) console.warn(`Could not determine tooltip for ${entityType}`)
        item.tooltipSfx = GameConfig.instance.objTtSFXs[entityType.toLowerCase()]
        if (!item.tooltipSfx) console.warn(`Could not determine tooltip SFX for ${entityType}`)
        item.tooltipDisabled = item.tooltip
        item.tooltipDisabledSfx = item.tooltipSfx
        this.btnLabelByType.set(entityType, item.addChild(new IconPanelButtonLabel()))
    }
}
