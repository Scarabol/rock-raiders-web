import { BuildingEntity } from './building/BuildingEntity'
import { PathTarget } from './PathTarget'

export class BuildingPathTarget extends PathTarget {

    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(building.getPosition2D())
        this.building = building
    }

}
