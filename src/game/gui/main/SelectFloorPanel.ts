import { Panel } from '../base/Panel'
import { SelectBasePanel } from './SelectBasePanel'
import { GameState } from '../../model/GameState'
import { Surface } from '../../../scene/model/map/Surface'
import { SurfaceType } from '../../../scene/model/map/SurfaceType'
import { Building } from '../../model/entity/building/Building'
import { CollectableType } from '../../../scene/model/collect/CollectableEntity'
import { EventBus } from '../../../event/EventBus'
import { BuildingSite } from '../../../scene/model/BuildingSite'
import { EntityDeselected } from '../../../event/LocalEvents'
import { EventKey } from '../../../event/EventKeyEnum'

export class SelectFloorPanel extends SelectBasePanel {

    constructor(onBackPanel: Panel) {
        super(3, onBackPanel)
        const pathItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_LayPath')
        pathItem.onClick = () => {
            const selectedSurface = GameState.selectedEntities[0] as Surface
            selectedSurface.surfaceType = SurfaceType.POWER_PATH_SITE
            selectedSurface.updateTexture()
            const targetBuilding = GameState.getClosestBuildingByType(selectedSurface.getCenterWorld(), Building.TOOLSTATION)
            if (targetBuilding) targetBuilding.spawnMaterials(GameState.dropMaterial(CollectableType.ORE, 2))
            const site = new BuildingSite(true)
            site.surfaces.push(selectedSurface)
            site.neededByType[CollectableType.ORE] = 2
            GameState.buildingSites.push(site)
            EventBus.publishEvent(new EntityDeselected())
        }
        pathItem.isDisabled = () => GameState.selectedSurface?.surfaceType !== SurfaceType.GROUND
        const removeItem = this.addMenuItem('InterfaceImages', 'Interface_MenuItem_RemovePath')
        removeItem.onClick = () => {
            GameState.selectedSurface?.makeRubble(2)
            EventBus.publishEvent(new EntityDeselected())
        }
        removeItem.isDisabled = () => GameState.selectedSurface?.surfaceType !== SurfaceType.POWER_PATH
        this.addMenuItem('InterfaceImages', 'Interface_MenuItem_PlaceFence')
        EventBus.registerEventListener(EventKey.SELECTED_SURFACE, () => {
            pathItem.updateState()
            removeItem.updateState()
        })
    }

}
