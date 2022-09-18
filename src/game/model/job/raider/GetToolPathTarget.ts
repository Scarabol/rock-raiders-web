import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'

export class GetToolPathTarget extends PathTarget {
    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(building.getDropPosition2D())
        this.building = building
    }
}
