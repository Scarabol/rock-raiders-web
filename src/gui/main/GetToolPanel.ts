import { EventKey } from '../../event/EventKeyEnum'
import { PickTool } from '../../event/GuiCommand'
import { BuildingsChangedEvent, SelectionChanged } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { RaiderTool, RaiderTools } from '../../game/model/raider/RaiderTool'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'

export class GetToolPanel extends IconSubPanel {
    hasToolstation: boolean = false
    everyHasTool: Map<RaiderTool, boolean> = new Map()

    constructor(onBackPanel: Panel) {
        super(8, onBackPanel)
        this.addGetToolItem(RaiderTool.DRILL)
        this.addGetToolItem(RaiderTool.SHOVEL)
        this.addGetToolItem(RaiderTool.HAMMER)
        this.addGetToolItem(RaiderTool.SPANNER)
        this.addGetToolItem(RaiderTool.FREEZER_GUN)
        this.addGetToolItem(RaiderTool.LASER)
        this.addGetToolItem(RaiderTool.PUSHER_GUN)
        this.addGetToolItem(RaiderTool.BIRD_SCARER)
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.hasToolstation = BuildingsChangedEvent.hasUsable(event, EntityType.TOOLSTATION)
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.everyHasTool = event.everyHasTool
            this.updateAllButtonStates()
        })
    }

    addGetToolItem(tool: RaiderTool): IconPanelButton {
        const itemKey = RaiderTools.toInterfaceItemKey(tool)
        const menuItem = super.addMenuItem(GameConfig.instance.interfaceImages, itemKey)
        menuItem.isDisabled = () => !this.hasToolstation || !!this.everyHasTool.get(tool)
        menuItem.onClick = () => this.publishEvent(new PickTool(tool))
        return menuItem
    }

    reset() {
        super.reset()
        this.hasToolstation = false
        this.everyHasTool = new Map()
    }
}
