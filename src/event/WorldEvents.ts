import { BaseEntity } from '../game/model/BaseEntity'
import { BuildingEntity } from '../game/model/building/BuildingEntity'
import { EntitySuperType, EntityType } from '../game/model/EntityType'
import { FulfillerEntity } from '../game/model/FulfillerEntity'
import { PublicJob } from '../game/model/job/Job'
import { Surface } from '../game/model/map/Surface'
import { RaiderSkill } from '../game/model/raider/RaiderSkill'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

export class WorldEvent extends GameEvent {

    constructor(entityKey: EventKey) {
        super(entityKey)
        this.isLocal = false
    }

}

export class JobEvent extends WorldEvent {

    job: PublicJob

    constructor(eventKey: EventKey, job: PublicJob) {
        super(eventKey)
        this.job = job
    }

}

export class JobCreateEvent extends JobEvent {

    constructor(job: PublicJob) {
        super(EventKey.JOB_CREATE, job)
    }

}

export class JobDeleteEvent extends JobEvent {

    constructor(job: PublicJob) {
        super(EventKey.JOB_DELETE, job)
    }

}

export class RaiderRequested extends WorldEvent {

    constructor() {
        super(EventKey.RAIDER_REQUESTED)
    }

}

export class MaterialAmountChanged extends WorldEvent {

    entityType: EntityType

    constructor(entityType: EntityType) {
        super(EventKey.MATERIAL_AMOUNT_CHANGED)
        this.entityType = entityType
    }

}

export class SpawnDynamiteEvent extends WorldEvent {

    surface: Surface

    constructor(surface: Surface) {
        super(EventKey.SPAWN_DYNAMITE)
        this.surface = surface
    }

}

export class EntityAddedEvent extends WorldEvent {

    superType: EntitySuperType
    entity: BaseEntity

    constructor(entity: BaseEntity) {
        super(EventKey.ENTITY_ADDED)
        this.superType = entity.superType
        this.entity = entity
    }

}

export class EntityRemovedEvent extends WorldEvent {

    superType: EntitySuperType
    entity: BaseEntity

    constructor(entity: BaseEntity) {
        super(EventKey.ENTITY_REMOVED)
        this.superType = entity.superType
        this.entity = entity
    }

}

export class CavernDiscovered extends WorldEvent {

    constructor() {
        super(EventKey.CAVERN_DISCOVERED)
    }

}

export class OreFoundEvent extends WorldEvent {

    constructor() {
        super(EventKey.ORE_FOUND)
    }

}

export class BuildingUpgraded extends WorldEvent {

    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(EventKey.BUILDING_UPGRADED)
        this.building = building
    }

}

export class RaiderTrained extends WorldEvent {

    entity: FulfillerEntity
    skill: RaiderSkill

    constructor(entity: FulfillerEntity, skill: RaiderSkill) {
        super(EventKey.RAIDER_TRAINED)
        this.entity = entity
        this.skill = skill
    }

}
