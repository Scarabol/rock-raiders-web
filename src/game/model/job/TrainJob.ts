import { Job } from './Job'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { JobType } from './JobType'
import { PathTarget } from '../../../scene/model/PathTarget'
import { Surface } from '../../../scene/model/map/Surface'
import { Area } from '../../../core/Area'
import { JOB_ACTION_RANGE, TILESIZE } from '../../../main'
import { Vector2 } from 'three'

export class TrainJob extends Job {

    workplaces: SurfacePathTarget[]
    skill: RaiderSkill

    constructor(surface: Surface, skill: RaiderSkill) {
        super(JobType.TRAIN)
        this.workplaces = [new SurfacePathTarget(surface)]
        this.skill = skill
    }

    getWorkplaces(): SurfacePathTarget[] {
        return this.workplaces
    }

}

export class SurfacePathTarget extends PathTarget {

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
