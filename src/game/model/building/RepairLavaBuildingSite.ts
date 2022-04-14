import { WorldManager } from '../../WorldManager'
import { EntityType } from '../EntityType'
import { Surface } from '../map/Surface'
import { BuildingSite } from './BuildingSite'

export class RepairLavaBuildingSite extends BuildingSite {
    constructor(worldMgr: WorldManager, surface: Surface) {
        super(worldMgr, surface, null, null, null, null)
        this.worldMgr.entityMgr.getClosestBuildingByType(surface.getCenterWorld(), EntityType.TOOLSTATION)?.spawnMaterials(EntityType.ORE, 2)
        this.neededByType.set(EntityType.ORE, 2)
        this.worldMgr.entityMgr.buildingSites.push(this)
    }
}
