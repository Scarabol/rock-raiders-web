import { IconSubPanel } from './IconSubPanel'
import { Panel } from '../base/Panel'
import { GameState } from '../../model/GameState'
import { RaiderTools } from '../../../scene/model/Raider'
import { IconPanelButton } from './IconPanelButton'
import { Building } from '../../model/entity/building/Building'
import { GetToolJob } from '../../model/job/GetToolJob'
import { EventBus } from '../../../event/EventBus'
import { EntityDeselected } from '../../../event/LocalEvents'

export class GetToolPanel extends IconSubPanel {

    constructor(onBackPanel: Panel) {
        super(8, onBackPanel)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetDrill', RaiderTools.DRILL)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetSpade', RaiderTools.SHOVEL)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetHammer', RaiderTools.HAMMER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetSpanner', RaiderTools.SPANNER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetFreezerGun', RaiderTools.FREEZERGUN)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetLaser', RaiderTools.LASER)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetPusherGun', RaiderTools.PUSHERGUN)
        this.addGetToolItem('InterfaceImages', 'Interface_MenuItem_GetBirdScarer', RaiderTools.BIRDSCARER)
    }

    addGetToolItem(menuItemGroup: string, itemKey: string, tool: string): IconPanelButton {
        const menuItem = super.addMenuItem(menuItemGroup, itemKey)
        menuItem.isDisabled = () => GameState.hasBuildingWithUpgrades(Building.TOOLSTATION, 0) &&
            GameState.selectedRaiders.every((r) => r.hasTools([tool]))
        menuItem.onClick = () => {
            GameState.selectedRaiders.forEach((r) => {
                if (!r.hasTools([tool])) {
                    const toolstation = GameState.getClosestBuildingByType(r.getPosition(), Building.TOOLSTATION)
                    r.setJob(new GetToolJob(toolstation.getDropPosition(), tool))
                }
            })
            EventBus.publishEvent(new EntityDeselected())
        }
        return menuItem
    }

}
