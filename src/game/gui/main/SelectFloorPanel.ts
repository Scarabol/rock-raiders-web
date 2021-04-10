import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { GameState } from '../../model/GameState'
import { Surface } from '../../../scene/model/map/Surface'
import { SurfaceType } from '../../../scene/model/map/SurfaceType'
import { Building } from '../../model/entity/building/Building'
import { CollectableType } from '../../../scene/model/collect/CollectableEntity'
import { EventBus } from '../../../event/EventBus'
import { SpawnMaterialEvent } from '../../../event/WorldEvents'
import { BuildingSite } from '../../../scene/model/BuildingSite'
import { EntityDeselected, SurfaceSelectedEvent } from '../../../event/LocalEvents'

export class SelectFloorPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(3, onBackPanel)
        const pathItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_LayPath')
        pathItem.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            selectedSurface.surfaceType = SurfaceType.POWER_PATH_SITE
            selectedSurface.updateTexture()
            const targetBuilding = GameState.getClosestBuildingByType(selectedSurface.getCenterWorld(), Building.TOOLSTATION)
            if (targetBuilding) {
                const ores = GameState.dropMaterial(CollectableType.ORE, 2)
                ores.forEach((ore) => {
                    EventBus.publishEvent(new SpawnMaterialEvent(ore, targetBuilding.getDropPosition())) // TODO use ToolNullName from cfg
                })
            }
            const site = new BuildingSite(true)
            site.surfaces.push(selectedSurface)
            site.neededByType[CollectableType.ORE] = 2
            GameState.buildingSites.push(site)
            EventBus.publishEvent(new EntityDeselected())
        }
        pathItem.isDisabled = () => GameState.selectedSurface?.hasRubble() // TODO introduce GameState getselected surface
        EventBus.registerEventListener(SurfaceSelectedEvent.eventKey, () => pathItem.updateState())
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_RemovePath')
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
    }

}
