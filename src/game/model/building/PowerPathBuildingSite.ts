import { EventBus } from '../../../event/EventBus'
import { DeselectAll } from '../../../event/LocalEvents'
import { EntityManager } from '../../EntityManager'
import { EntityType } from '../EntityType'
import { Surface } from '../map/Surface'
import { SurfaceType } from '../map/SurfaceType'
import { BuildingSite } from './BuildingSite'

export class PowerPathBuildingSite extends BuildingSite {

    constructor(entityMgr: EntityManager, surface: Surface) {
        super(entityMgr, surface, null, surface, null, null)
        surface.setSurfaceType(SurfaceType.POWER_PATH_BUILDING_SITE)
        entityMgr.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnMaterials(EntityType.ORE, 2)
        this.neededByType.set(EntityType.ORE, 2)
        entityMgr.buildingSites.push(this)
        EventBus.publishEvent(new DeselectAll())
    }

}
