import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'
import { GameState } from '../../model/GameState'
import { IconPanelButton } from './IconPanelButton'
import { Building } from '../../model/entity/building/Building'
import { GetToolJob } from '../../model/job/GetToolJob'
import { EventBus } from '../../../event/EventBus'
import { EntityDeselected } from '../../../event/LocalEvents'
import { RaiderTool } from '../../../scene/model/RaiderTool'

export class GetToolPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(8, onBackPanel)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetDrill', RaiderTool.DRILL)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetSpade', RaiderTool.SHOVEL)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetHammer', RaiderTool.HAMMER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetSpanner', RaiderTool.SPANNER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetFreezerGun', RaiderTool.FREEZERGUN)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetLaser', RaiderTool.LASER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetPusherGun', RaiderTool.PUSHERGUN)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetBirdScarer', RaiderTool.BIRDSCARER)
    }

    addGetToolItem(menuItemGroup: string, itemKey: string, tool: RaiderTool): IconPanelButton {
        const menuItem = super.addMenuItem(menuItemGroup, itemKey)
        menuItem.isDisabled = () => !GameState.hasOneBuildingOf(Building.TOOLSTATION) ||
            GameState.selectedRaiders.every((r) => r.hasTool(tool))
        menuItem.onClick = () => {
            GameState.selectedRaiders.forEach((r) => {
                if (!r.hasTool(tool)) {
                    const pathToToolstation = GameState.getBuildingsByType(Building.TOOLSTATION)
                        .map((b) => r.findPathToTarget(b.getPosition2D()))
                        .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                    if (pathToToolstation) {
                        r.setJob(new GetToolJob(pathToToolstation.target, tool)) // TODO use precalculated path to toolstation
                    }
                }
            })
            EventBus.publishEvent(new EntityDeselected())
        }
        return menuItem
    }

}
