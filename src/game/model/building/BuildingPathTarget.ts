import { PathTarget } from '../PathTarget'
import { BuildingEntity } from './BuildingEntity'

export class BuildingPathTarget extends PathTarget {

    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(building.sceneEntity.position2D.clone())
        this.building = building
    }

}
