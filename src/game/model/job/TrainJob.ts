import { Job } from './Job'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { JobType } from './JobType'
import { SurfacePathTarget } from '../../../scene/model/PathTarget'
import { Surface } from '../../../scene/model/map/Surface'
import { JOB_ACTION_RANGE, TILESIZE } from '../../../main'
import { Area } from '../../../core/Area'

export class TrainJob extends Job {

    workplaces: SurfacePathTarget[]
    skill: RaiderSkill

    constructor(surface: Surface, skill: RaiderSkill) {
        super(JobType.TRAIN)
        this.workplaces = [new SurfacePathTarget(new Area(surface.x * TILESIZE - JOB_ACTION_RANGE, surface.y * TILESIZE - JOB_ACTION_RANGE,
            (surface.x + 1) * TILESIZE + JOB_ACTION_RANGE, (surface.y + 1) * TILESIZE + JOB_ACTION_RANGE))]
        this.skill = skill
    }

    getWorkplaces(): SurfacePathTarget[] {
        return this.workplaces
    }

}
