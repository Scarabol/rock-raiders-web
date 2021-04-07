import { GameEvent } from './EventBus'
import { Job } from '../game/model/job/Job'
import { CollectableEntity, CollectableType } from '../scene/model/collect/CollectableEntity'
import { AnimEntity } from '../scene/model/anim/AnimEntity'
import { Vector3 } from 'three'
import { Surface } from '../scene/model/map/Surface'

export class WorldEvent extends GameEvent {

    constructor(entityKey: string) {
        super(entityKey)
        this.isLocal = false
    }

}

export class JobEvent extends WorldEvent {

    job: Job

    constructor(eventKey: string, job: Job) {
        super(eventKey)
        this.job = job
    }

}

export class JobCreateEvent extends JobEvent {

    static eventKey = 'job.create'

    constructor(job: Job) {
        super(JobCreateEvent.eventKey, job)
    }

}

export class JobDeleteEvent extends JobEvent {

    static eventKey = 'job.delete'

    constructor(job: Job) {
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
    spawnPosition: Vector3

    constructor(collectable: CollectableEntity, spawnPosition: Vector3) {
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
