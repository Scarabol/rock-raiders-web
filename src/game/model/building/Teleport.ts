import { Vector2 } from 'three'
import { Sample } from '../../../audio/Sample'
import { EventBus } from '../../../event/EventBus'
import { RaidersChangedEvent } from '../../../event/LocalEvents'
import { TILESIZE } from '../../../params'
import { RaiderActivity } from '../activities/RaiderActivity'
import { EntityType } from '../EntityType'
import { FulfillerEntity } from '../FulfillerEntity'
import { MoveJob } from '../job/raider/MoveJob'
import { BuildingEntity } from './BuildingEntity'

export abstract class Teleport {

    building: BuildingEntity // FIXME instead hook in setter for position and heading
    operating: boolean
    powered: boolean

    constructor(building: BuildingEntity) {
        this.building = building
    }

    canTeleportIn(entityType: EntityType): boolean {
        return this.powered && !this.operating
    }

    teleportIn<T extends FulfillerEntity>(entity: T, listing: T[]) {
        this.operating = true
        const heading = this.building.getHeading()
        entity.addToScene(new Vector2(0, TILESIZE / 2).rotateAround(new Vector2(0, 0), -heading).add(this.building.getPosition2D()), heading)
        entity.playPositionalAudio(Sample[Sample.SND_teleport], false)
        entity.changeActivity(RaiderActivity.TeleportIn, () => {
            this.operating = false
            entity.changeActivity() // FIXME move all lines into onAddScene for entities
            entity.sceneEntity.createPickSphere(entity.stats.PickSphere, entity)
            const walkOutPos = this.building.primaryPathSurface.getRandomPosition()
            entity.setJob(new MoveJob(walkOutPos))
            listing.push(entity)
            EventBus.publishEvent(new RaidersChangedEvent(entity.entityMgr))
        })
    }

}

export class RaiderOnlyTeleport extends Teleport {

    canTeleportIn(entityType: EntityType): boolean {
        return super.canTeleportIn(entityType) && entityType === EntityType.PILOT
    }

}

export class SmallTeleport extends Teleport {

    canTeleportIn(entityType: EntityType): boolean {
        // FIXME check if primary surface is occupied
        return super.canTeleportIn(entityType) && SmallTeleport.isSmall(entityType)
    }

    private static isSmall(entityType: EntityType) { // FIXME refactor this re-introduce SuperEntityType or add flags to entity types in general
        return entityType === EntityType.PILOT ||
            entityType === EntityType.HOVERBOARD ||
            entityType === EntityType.SMALL_TRUCK ||
            entityType === EntityType.SMALL_CAT ||
            entityType === EntityType.SMALL_DIGGER ||
            entityType === EntityType.SMALL_MLP ||
            entityType === EntityType.SMALL_HELI
    }

}

export class SuperTeleport extends Teleport {

    canTeleportIn(entityType: EntityType): boolean {
        return super.canTeleportIn(entityType)
    }

}
