import { EventBus } from '../../../event/EventBus'
import { DeselectAll } from '../../../event/LocalEvents'
import { EntityType } from '../EntityType'
import { GameState } from '../GameState'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { BuildingSite } from './BuildingSite'

export class PowerPathBuildingSite extends BuildingSite {

    constructor(surface: Surface) {
        super(surface, null, null, null, null)
        surface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING_SITE)
        GameState.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnMaterials(EntityType.ORE, 2)
        this.neededByType.set(EntityType.ORE, 2)
        GameState.buildingSites.push(this)
        EventBus.publishEvent(new DeselectAll())
    }

}
