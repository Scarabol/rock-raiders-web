import { Vector3 } from 'three'
import { CollectableEntity, CollectableType, CollectTargetType } from '../../../scene/model/collect/CollectableEntity'
import { JOB_ACTION_RANGE, RAIDER_SPEED } from '../../../main'
import { GameState } from '../GameState'
import { EventBus } from '../../../event/EventBus'
import { CollectEvent } from '../../../event/WorldEvents'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { Building } from '../entity/building/Building'

export enum JobType {

    SURFACE,
    CARRY,
    MOVE,

}

export enum JobState {

    OPEN,
    COMPLETE,
    CANCELED,

}

export abstract class Job {

    type: JobType
    jobstate: JobState
    fulfiller: FulfillerEntity[] = []

    protected constructor(type: JobType) {
        this.type = type
        this.jobstate = JobState.OPEN
    }

    assign(fulfiller: FulfillerEntity) {
        const index = this.fulfiller.indexOf(fulfiller)
        if (fulfiller && index === -1) {
            this.fulfiller.push(fulfiller)
        }
    }

    unassign(fulfiller: FulfillerEntity) {
        const index = this.fulfiller.indexOf(fulfiller)
        if (index > -1) this.fulfiller.splice(index, 1)
    }

    cancel() {
        this.jobstate = JobState.CANCELED
        const fulfiller = this.fulfiller // ensure consistency while processing
        this.fulfiller = []
        fulfiller.forEach((fulfiller) => fulfiller.stopJob())
    }

    isQualified(fulfiller: FulfillerEntity): boolean {
        return true
    }

    onJobComplete() {
        this.jobstate = JobState.COMPLETE
    }

    abstract getPosition(): Vector3; // TODO job system in 2d should be sufficient and decouple from three for deps and worker reasons

    abstract isInArea(x: number, z: number): boolean;

}

export class CollectJob extends Job {

    item: CollectableEntity

    constructor(item: CollectableEntity) {
        super(JobType.CARRY)
        this.item = item
    }

    getPosition(): Vector3 {
        return this.item.getPosition()
    }

    isInArea(x: number, z: number): boolean {
        const pos = this.getPosition()
        return pos.sub(new Vector3(x, pos.y, z)).length() < JOB_ACTION_RANGE
    }

    isQualified(fulfiller: FulfillerEntity) {
        return fulfiller.carries === null && !!this.item.getTargetPos()
    }

    onJobComplete() {
        super.onJobComplete()
        if (this.item.getTargetType() === Building.TOOLSTATION) {
            switch (this.item.getCollectableType()) {
                case CollectableType.CRYSTAL:
                    GameState.numCrystal++
                    EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()))
                    break
                case CollectableType.ORE:
                    GameState.numOre++
                    EventBus.publishEvent(new CollectEvent(this.item.getCollectableType()))
                    break
            }
        } else if (this.item.getTargetType() === CollectTargetType.BUILDING_SITE) {
            this.item.targetSite.addItem(this.item)
        } else {
            console.error('target type not yet implemented: ' + this.item.getTargetType())
        }
    }

}

export class MoveJob extends Job {

    target: Vector3

    constructor(target: Vector3) {
        super(JobType.MOVE)
        this.target = target
    }

    getPosition(): Vector3 {
        return new Vector3().copy(this.target)
    }

    isInArea(x: number, z: number) {
        return this.getPosition().sub(new Vector3(x, this.target.y, z)).lengthSq() < RAIDER_SPEED * RAIDER_SPEED
    }

}
