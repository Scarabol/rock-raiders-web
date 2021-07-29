import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'

export class GetToolPathTarget extends PathTarget {
    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(building.sceneEntity.position2D.clone())
        this.building = building
    }

    isInvalid(): boolean {
        return !this.building.isPowered()
    }
}
