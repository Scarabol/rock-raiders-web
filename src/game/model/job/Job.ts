import { Vector3 } from 'three'
import { FulfillerEntity } from '../../../scene/model/FulfillerEntity'
import { removeFromArray } from '../../../core/Util'

export enum JobType {

    SURFACE,
    CARRY,
    MOVE,
    TRAIN,
    GET_TOOL,
    EAT,

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
        removeFromArray(this.fulfiller, fulfiller)
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

    isQualifiedWithTool(fulfiller: FulfillerEntity): string {
        return null
    }

    isQualifiedWithTraining(fulfiller: FulfillerEntity): string {
        return null
    }

    onJobComplete() {
        this.jobstate = JobState.COMPLETE
    }

    abstract getPosition(): Vector3;

    abstract isInArea(x: number, z: number): boolean;

}

export abstract class PublicJob extends Job {

    abstract getPriorityIdentifier(): string

}

