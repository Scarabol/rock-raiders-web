import { EventBus } from '../../../event/EventBus'
import { DeselectAll } from '../../../event/LocalEvents'
import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { BuildingSite } from './BuildingSite'

export class PowerPathBuildingSite extends BuildingSite {
    constructor(worldMgr: WorldManager, surface: Surface) {
        super(worldMgr, surface, null, null, null, null)
        surface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING_SITE)
        this.worldMgr.entityMgr.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnMaterials(EntityType.ORE, 2)
        this.neededByType.set(EntityType.ORE, 2)
        this.worldMgr.entityMgr.buildingSites.push(this)
        EventBus.publishEvent(new DeselectAll())
    }
}
