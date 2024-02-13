import { AbstractGameComponent } from '../ECS'
import { EntityType } from '../model/EntityType'
import { Surface } from '../terrain/Surface'

export class TeleportComponent extends AbstractGameComponent {
    operating: boolean = false

    constructor(
        readonly teleportedEntityTypes: EntityType[],
        readonly pathSurfaces: Surface[],
        readonly heading: number,
        readonly primaryPathSurface: Surface,
        readonly waterPathSurface: Surface,
    ) {
        super()
    }

    canTeleportIn(entityType: EntityType): boolean {
        return !this.operating && this.teleportedEntityTypes.includes(entityType) &&
            (entityType === EntityType.PILOT || !this.pathSurfaces.some((s) => s.isBlockedByVehicle()))
    }
}
