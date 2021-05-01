import { Vector2 } from 'three'
import { Area } from '../../../core/Area'
import { JOB_ACTION_RANGE, TILESIZE } from '../../../params'
import { Surface } from '../map/Surface'
import { PathTarget } from '../PathTarget'
import { RaiderTraining } from '../raider/RaiderTraining'
import { Job } from './Job'
import { JobType } from './JobType'

export class TrainJob extends Job {

    workplaces: TrainingPathTarget[]
    training: RaiderTraining

    constructor(surface: Surface, training: RaiderTraining) {
        super(JobType.TRAIN)
        this.workplaces = [new TrainingPathTarget(surface)]
        this.training = training
    }

    getWorkplaces(): TrainingPathTarget[] {
        return this.workplaces
    }

}

export class TrainingPathTarget extends PathTarget {

    targetArea: Area

    constructor(surface: Surface) {
        super(surface.getCenterWorld2D())
        this.targetArea = new Area(surface.x * TILESIZE - JOB_ACTION_RANGE, surface.y * TILESIZE - JOB_ACTION_RANGE,
            (surface.x + 1) * TILESIZE + JOB_ACTION_RANGE, (surface.y + 1) * TILESIZE + JOB_ACTION_RANGE)
    }

    isInArea(position: Vector2): boolean {
        return position.x >= this.targetArea.x0 && position.x < this.targetArea.x1
            && position.y >= this.targetArea.y0 && position.y < this.targetArea.y1
    }

}
