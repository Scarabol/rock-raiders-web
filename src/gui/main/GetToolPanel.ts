import { EventKey } from '../../event/EventKeyEnum'
import { SelectedRaiderPickTool } from '../../event/GuiCommand'
import { BuildingsChangedEvent, SelectionChanged } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { RaiderTool } from '../../game/model/raider/RaiderTool'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { IconSubPanel } from './IconSubPanel'

export class GetToolPanel extends IconSubPanel {
    numUsableToolstations: number = 0
    everyHasTool: Map<RaiderTool, boolean> = new Map()

    constructor(parent: BaseElement, onBackPanel: Panel) {
        super(parent, 8, onBackPanel)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetDrill', RaiderTool.DRILL)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetSpade', RaiderTool.SHOVEL)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetHammer', RaiderTool.HAMMER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetSpanner', RaiderTool.SPANNER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetFreezerGun', RaiderTool.FREEZERGUN)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetLaser', RaiderTool.LASER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetPusherGun', RaiderTool.PUSHERGUN)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetBirdScarer', RaiderTool.BIRDSCARER)
        this.registerEventListener(EventKey.BUILDINGS_CHANGED, (event: BuildingsChangedEvent) => {
            this.numUsableToolstations = BuildingsChangedEvent.countUsable(event, EntityType.TOOLSTATION)
            this.updateAllButtonStates()
        })
        this.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            this.everyHasTool = event.everyHasTool
            this.updateAllButtonStates()
        })
    }

    addGetToolItem(menuItemGroup: string, itemKey: string, tool: RaiderTool): IconPanelButton {
        const menuItem = super.addMenuItem(menuItemGroup, itemKey)
        menuItem.isDisabled = () => this.numUsableToolstations < 1 || !!this.everyHasTool.get(tool)
        menuItem.onClick = () => this.publishEvent(new SelectedRaiderPickTool(tool))
        return menuItem
    }

    reset() {
        super.reset()
        this.numUsableToolstations = 0
        this.everyHasTool = new Map()
    }
}
