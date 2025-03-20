import { SelectBuildMode } from '../../event/GuiCommand'
import { EntityType } from '../../game/model/EntityType'
import { Panel } from '../base/Panel'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'
import { InterfaceBuildImage } from '../../cfg/InterfaceImageCfg'

export class BuildingPanel extends IconSubPanel {
    constructor(onBackPanel: Panel) {
        super(10, onBackPanel, false)
        this.addBuildMenuItem('toolstation', EntityType.TOOLSTATION)
        this.addBuildMenuItem('teleportPad', EntityType.TELEPORT_PAD)
        this.addBuildMenuItem('docks', EntityType.DOCKS)
        this.addBuildMenuItem('powerStation', EntityType.POWER_STATION)
        this.addBuildMenuItem('barracks', EntityType.BARRACKS)
        this.addBuildMenuItem('upgrade', EntityType.UPGRADE)
        this.addBuildMenuItem('geoDome', EntityType.GEODOME)
        this.addBuildMenuItem('oreRefinery', EntityType.ORE_REFINERY)
        this.addBuildMenuItem('gunstation', EntityType.GUNSTATION)
        this.addBuildMenuItem('teleportBig', EntityType.TELEPORT_BIG)
    }

    addBuildMenuItem(interfaceBuildImage: InterfaceBuildImage, entityType: EntityType) {
        const item = super.addMenuItem(GameConfig.instance.interfaceBuildImages[interfaceBuildImage])
        item.isDisabled = () => item.hasUnfulfilledDependency
        item.onClick = () => this.publishEvent(new SelectBuildMode(entityType))
        item.tooltip = GameConfig.instance.objectNames[entityType.toLowerCase()]
        if (!item.tooltip) console.warn(`Could not determine tooltip for ${entityType}`)
        item.tooltipSfx = GameConfig.instance.objTtSFXs[entityType.toLowerCase()]
        if (!item.tooltipSfx) console.warn(`Could not determine tooltip SFX for ${entityType}`)
        item.tooltipDisabled = item.tooltip
        item.tooltipDisabledSfx = item.tooltipSfx
    }
}
