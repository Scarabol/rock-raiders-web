import { CancelBuildMode, SelectBuildMode } from '../../event/GuiCommand'
import { EntityType } from '../../game/model/EntityType'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { OffscreenCache } from '../../worker/OffscreenCache'
import { Sample } from '../../audio/Sample'
import { IconSubPanel } from './IconSubPanel'

export class BuildingPanel extends IconSubPanel {
    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 10, onBackPanel)
        this.backBtn.onClick = () => {
            this.publishEvent(new CancelBuildMode())
            this.toggleState(() => onBackPanel.toggleState())
        }
        this.addBuildMenuItem('Toolstation', EntityType.TOOLSTATION, Sample.ObjSFX_Toolstation)
        this.addBuildMenuItem('TeleportPad', EntityType.TELEPORT_PAD, Sample.ObjSFX_TeleportPad)
        this.addBuildMenuItem('Docks', EntityType.DOCKS, Sample.ObjSFX_Docks)
        this.addBuildMenuItem('Powerstation', EntityType.POWER_STATION, Sample.ObjSFX_Powerstation)
        this.addBuildMenuItem('Barracks', EntityType.BARRACKS, Sample.ObjSFX_Barracks)
        this.addBuildMenuItem('Upgrade', EntityType.UPGRADE, Sample.ObjSFX_Upgrade)
        this.addBuildMenuItem('Geo-dome', EntityType.GEODOME, Sample.ObjSFX_Geodome)
        this.addBuildMenuItem('OreRefinery', EntityType.ORE_REFINERY, Sample.ObjSFX_OreRefinery)
        this.addBuildMenuItem('Gunstation', EntityType.GUNSTATION, Sample.ObjSFX_Gunstation)
        this.addBuildMenuItem('TeleportBIG', EntityType.TELEPORT_BIG, Sample.ObjSFX_TeleportBIG)
    }

    addBuildMenuItem(itemKey: string, entityType: EntityType, tooltipSfx: Sample) {
        const item = super.addMenuItem(OffscreenCache.configuration.interfaceBuildImages, itemKey)
        item.onClick = () => this.publishEvent(new SelectBuildMode(entityType))
        item.tooltip = OffscreenCache.configuration.objectNamesCfg.get(itemKey.toLowerCase())
        item.tooltipSfx = Sample[tooltipSfx]
    }
}
