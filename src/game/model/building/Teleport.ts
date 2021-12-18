import { Vector2 } from 'three'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersAmountChangedEvent } from '../../../event/LocalEvents'
import { TILESIZE } from '../../../params'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { MoveJob } from '../job/raider/MoveJob'
import { Raider } from '../raider/Raider'
import { VehicleEntity } from '../vehicle/VehicleEntity'
import { BuildingEntity } from './BuildingEntity'

export abstract class Teleport {
    building: BuildingEntity // TODO instead hook in setter for position and heading
    operating: boolean = false
    powered: boolean = false

    canTeleportIn(entityType: EntityType): boolean {
        return this.powered && !this.operating
    }

    teleportInRaider(raider: Raider, listing: Raider[], beamListing: Raider[]) {
        const heading = this.building.sceneEntity.getHeading()
        const worldPosition = new Vector2(0, TILESIZE / 2).rotateAround(new Vector2(0, 0), -heading).add(this.building.sceneEntity.position2D.clone())
        const walkOutPos = this.building.primaryPathSurface.getRandomPosition()
        this.teleportIn(raider, listing, beamListing, worldPosition, heading, walkOutPos)
    }

    teleportInVehicle(vehicle: VehicleEntity, listing: VehicleEntity[], beamListing: VehicleEntity[]) {
        const worldPosition = this.building.primaryPathSurface.getCenterWorld2D()
        const heading = this.building.sceneEntity.getHeading()
        this.teleportIn(vehicle, listing, beamListing, worldPosition, heading, null)
    }

    private teleportIn<T extends FulfillerEntity>(entity: T, listing: T[], beamListing: T[], worldPosition: Vector2, heading: number, walkOutPos: Vector2) {
        this.operating = true
        entity.sceneEntity.addToScene(worldPosition, heading)
        entity.sceneEntity.playPositionalAudio(Sample[Sample.SND_teleport], false)
        entity.sceneEntity.changeActivity(RaiderActivity.TeleportIn, () => {
            this.operating = false
            entity.sceneEntity.changeActivity()
            entity.sceneEntity.makeSelectable(entity)
            if (walkOutPos) entity.setJob(new MoveJob(walkOutPos))
            beamListing.remove(entity)
            listing.push(entity)
            EventBus.publishEvent(new RaidersAmountChangedEvent(entity.entityMgr))
        })
        beamListing.push(entity)
    }
}

export class RaiderOnlyTeleport extends Teleport {
    canTeleportIn(entityType: EntityType): boolean {
        return super.canTeleportIn(entityType) && entityType === EntityType.PILOT
    }
}

export class SmallTeleport extends Teleport {
    canTeleportIn(entityType: EntityType): boolean {
        return super.canTeleportIn(entityType) && SmallTeleport.isSmall(entityType)
    }

    private static isSmall(entityType: EntityType) { // TODO evaluate stats UseSmallTeleporter
        return entityType === EntityType.PILOT ||
            entityType === EntityType.HOVERBOARD ||
            entityType === EntityType.SMALL_TRUCK ||
            entityType === EntityType.SMALL_CAT ||
            entityType === EntityType.SMALL_DIGGER ||
            entityType === EntityType.SMALL_MLP ||
            entityType === EntityType.SMALL_HELI
    }
}

export class BigTeleport extends Teleport {
    canTeleportIn(entityType: EntityType): boolean {
        return super.canTeleportIn(entityType) && BigTeleport.isLarge(entityType)
    }

    private static isLarge(entityType: EntityType) { // TODO evaluate stats UseLargeTeleporter
        return entityType === EntityType.BULLDOZER ||
            entityType === EntityType.WALKER_DIGGER ||
            entityType === EntityType.LARGE_MLP ||
            entityType === EntityType.LARGE_DIGGER ||
            entityType === EntityType.LARGE_CAT
    }
}
