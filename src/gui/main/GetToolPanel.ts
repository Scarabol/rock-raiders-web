import { EntityDeselected } from '../../event/LocalEvents'
import { EntityType } from '../../game/model/EntityType'
import { GameState } from '../../game/model/GameState'
import { GetToolJob } from '../../game/model/job/GetToolJob'
import { PathTarget } from '../../game/model/PathTarget'
import { RaiderTool } from '../../game/model/raider/RaiderTool'
import { BaseElement } from '../base/BaseElement'
import { Panel } from '../base/Panel'
import { IconPanelButton } from './IconPanelButton'
import { IconSubPanel } from './IconSubPanel'

export class GetToolPanel extends IconSubPanel {

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
    }

    addGetToolItem(menuItemGroup: string, itemKey: string, tool: RaiderTool): IconPanelButton {
        const menuItem = super.addMenuItem(menuItemGroup, itemKey)
        menuItem.isDisabled = () => !GameState.hasOneBuildingOf(EntityType.TOOLSTATION) ||
            GameState.selectedRaiders.every((r) => r.hasTool(tool))
        menuItem.onClick = () => {
            GameState.selectedRaiders.forEach((r) => {
                if (!r.hasTool(tool)) {
                    const pathToToolstation = GameState.getBuildingsByType(EntityType.TOOLSTATION)
                        .map((b) => r.findPathToTarget(new PathTarget(b.getPosition2D())))
                        .sort((l, r) => l.lengthSq - r.lengthSq)[0]
                    if (pathToToolstation) {
                        r.setJob(new GetToolJob(pathToToolstation.targetPosition, tool)) // TODO use precalculated path to toolstation
                    }
                }
            })
            this.publishEvent(new EntityDeselected())
        }
        return menuItem
    }

}
