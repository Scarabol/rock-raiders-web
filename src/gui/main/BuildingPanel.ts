import { CancelBuildMode, SelectBuildMode } from '../../event/GuiCommand'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'

export class BuildingPanel extends IconSubPanel {
    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 10, onBackPanel)
        this.backBtn.onClick = () => {
            this.publishEvent(new CancelBuildMode())
            this.toggleState(() => onBackPanel.toggleState())
        }
        this.addBuildMenuItem(EntityType.TOOLSTATION)
        this.addBuildMenuItem(EntityType.TELEPORT_PAD)
        this.addBuildMenuItem(EntityType.DOCKS)
        this.addBuildMenuItem(EntityType.POWER_STATION)
        this.addBuildMenuItem(EntityType.BARRACKS)
        this.addBuildMenuItem(EntityType.UPGRADE)
        this.addBuildMenuItem(EntityType.GEODOME)
        this.addBuildMenuItem(EntityType.ORE_REFINERY)
        this.addBuildMenuItem(EntityType.GUNSTATION)
        this.addBuildMenuItem(EntityType.TELEPORT_BIG)
    }

    addBuildMenuItem(entityType: EntityType) {
        const item = super.addMenuItem(GameConfig.instance.interfaceBuildImages, entityType.toLowerCase())
        item.isDisabled = () => item.hasUnfulfilledDependency
        item.onClick = () => this.publishEvent(new SelectBuildMode(entityType))
        item.tooltip = GameConfig.instance.objectNamesCfg.get(entityType.toLowerCase())
        if (!item.tooltip) console.warn(`Could not determine tooltip for ${entityType}`)
        item.tooltipSfx = GameConfig.instance.objTtSFXs.get(entityType.toLowerCase())
        if (!item.tooltipSfx) console.warn(`Could not determine tooltip SFX for ${entityType}`)
        item.tooltipDisabled = item.tooltip
        item.tooltipDisabledSfx = item.tooltipSfx
    }
}
