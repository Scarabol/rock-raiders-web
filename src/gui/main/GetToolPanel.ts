import { EventKey } from '../../event/EventKeyEnum'
import { PickTool } from '../../event/GuiCommand'
import { BuildingsChangedEvent, SelectionChanged } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { RaiderTool } from '../../game/model/raider/RaiderTool'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { IconSubPanel } from './IconSubPanel'
import { GameConfig } from '../../cfg/GameConfig'
import { InterfaceImage } from '../../cfg/InterfaceImageCfg'

export class GetToolPanel extends IconSubPanel {
    hasToolstation: boolean = false
    everyHasTool: Map<RaiderTool, boolean> = new Map()

    constructor(onBackPanel: Panel) {
        super(8, onBackPanel, false)
        this.addGetToolItem('getDrill', RaiderTool.DRILL)
        this.addGetToolItem('getSpade', RaiderTool.SHOVEL)
        this.addGetToolItem('getHammer', RaiderTool.HAMMER)
        this.addGetToolItem('getSpanner', RaiderTool.SPANNER)
        this.addGetToolItem('getFreezerGun', RaiderTool.FREEZER_GUN)
        this.addGetToolItem('getLaser', RaiderTool.LASER)
        this.addGetToolItem('getPusherGun', RaiderTool.PUSHER_GUN)
        this.addGetToolItem('getBirdScarer', RaiderTool.BIRD_SCARER)
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.hasToolstation = BuildingsChangedEvent.hasUsable(event, EntityType.TOOLSTATION)
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.everyHasTool = event.everyHasTool
            this.updateAllButtonStates()
        })
    }

    addGetToolItem(interfaceImage: InterfaceImage, tool: RaiderTool): IconPanelButton {
        const menuItem = super.addMenuItem(GameConfig.instance.interfaceImages[interfaceImage])
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
