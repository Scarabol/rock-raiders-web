import { PublicJob } from '../game/model/job/Job'
import { CollectableType } from '../scene/model/collect/CollectableEntity'
import { AnimEntity } from '../scene/model/anim/AnimEntity'
import { Surface } from '../scene/model/map/Surface'
import { BuildingEntity } from '../scene/model/BuildingEntity'
import { FulfillerEntity } from '../scene/model/FulfillerEntity'
import { RaiderSkill } from '../scene/model/RaiderSkill'
import { GameEvent } from './GameEvent'
import { EventKey } from './EventKeyEnum'

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

    collectableType: CollectableType

    constructor(collectableType: CollectableType) {
        super(EventKey.MATERIAL_AMOUNT_CHANGED)
        this.collectableType = collectableType
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

    type: EntityType
    entity: AnimEntity

    constructor(type: EntityType, entity: AnimEntity) {
        super(EventKey.ENTITY_ADDED)
        this.type = type
        this.entity = entity
    }

}

export class EntityRemovedEvent extends WorldEvent {

    type: EntityType
    entity: AnimEntity

    constructor(type: EntityType, entity: AnimEntity) {
        super(EventKey.ENTITY_REMOVED)
        this.type = type
        this.entity = entity
    }

}

export enum EntityType {

    RAIDER,
    VEHICLE,
    BUILDING,

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

    constructor(raider: FulfillerEntity, skill: RaiderSkill) {
        super(EventKey.RAIDER_TRAINED)
        this.entity = raider
        this.skill = skill
    }

}
