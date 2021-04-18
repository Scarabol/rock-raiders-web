import { GameEvent } from './EventBus'
import { PublicJob } from '../game/model/job/Job'
import { CollectableEntity, CollectableType } from '../scene/model/collect/CollectableEntity'
import { AnimEntity } from '../scene/model/anim/AnimEntity'
import { Vector2 } from 'three'
import { Surface } from '../scene/model/map/Surface'
import { BuildingEntity } from '../scene/model/BuildingEntity'
import { FulfillerEntity } from '../scene/model/FulfillerEntity'
import { RaiderSkill } from '../scene/model/RaiderSkill'

export class WorldEvent extends GameEvent {

    constructor(entityKey: string) {
        super(entityKey)
        this.isLocal = false
    }

}

export class JobEvent extends WorldEvent {

    job: PublicJob

    constructor(eventKey: string, job: PublicJob) {
        super(eventKey)
        this.job = job
    }

}

export class JobCreateEvent extends JobEvent {

    static eventKey = 'job.create'

    constructor(job: PublicJob) {
        super(JobCreateEvent.eventKey, job)
    }

}

export class JobDeleteEvent extends JobEvent {

    static eventKey = 'job.delete'

    constructor(job: PublicJob) {
        super(JobDeleteEvent.eventKey, job)
    }

}

export class RaiderRequested extends WorldEvent {

    static eventKey = 'raider.request'

    numRequested: number = 0

    constructor(numRequested: number) {
        super(RaiderRequested.eventKey)
        this.numRequested = numRequested
    }

}

export class CollectEvent extends WorldEvent {

    static eventKey = 'item.collected'

    collectType: CollectableType

    constructor(collectType: CollectableType) {
        super(CollectEvent.eventKey)
        this.collectType = collectType
    }

}

export class SpawnDynamiteEvent extends WorldEvent {

    static eventKey = 'spawn.dynamite'

    surface: Surface

    constructor(surface: Surface) {
        super(SpawnDynamiteEvent.eventKey)
        this.surface = surface
    }

}

export class SpawnMaterialEvent extends WorldEvent {

    static eventKey = 'spawn.material'

    collectable: CollectableEntity
    spawnPosition: Vector2

    constructor(collectable: CollectableEntity, spawnPosition: Vector2) {
        super(SpawnMaterialEvent.eventKey)
        this.collectable = collectable
        this.spawnPosition = spawnPosition
    }

}

export class EntityAddedEvent extends WorldEvent {

    static eventKey = 'added.entity'

    type: EntityType
    entity: AnimEntity

    constructor(type: EntityType, entity: AnimEntity) {
        super(EntityAddedEvent.eventKey)
        this.type = type
        this.entity = entity
    }

}

export class EntityRemovedEvent extends WorldEvent {

    static eventKey = 'remove.entity'

    type: EntityType
    entity: AnimEntity

    constructor(type: EntityType, entity: AnimEntity) {
        super(EntityRemovedEvent.eventKey)
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

    static eventKey = 'cavern.discovered'

    constructor() {
        super(CavernDiscovered.eventKey)
    }

}

export class OreFoundEvent extends WorldEvent {

    static eventKey = 'ore.found'

    constructor() {
        super(OreFoundEvent.eventKey)
    }

}

export class BuildingUpgraded extends WorldEvent {

    static eventKey = 'upgraded.building'

    building: BuildingEntity

    constructor(building: BuildingEntity) {
        super(BuildingUpgraded.eventKey)
        this.building = building
    }

}

export class RaiderTrained extends WorldEvent {

    static eventKey = 'trained.raider'

    entity: FulfillerEntity
    skill: RaiderSkill

    constructor(raider: FulfillerEntity, skill: RaiderSkill) {
        super(RaiderTrained.eventKey)
        this.entity = raider
        this.skill = skill
    }

}
