import { FulfillerEntity } from '../../FulfillerEntity'
import { Surface } from '../../map/Surface'
import { RaiderSkill } from '../../raider/RaiderSkill'
import { RaiderTool } from '../../raider/RaiderTool'
import { PublicJob } from '../Job'
import { JobType } from '../JobType'

export abstract class SurfaceJob extends PublicJob {

    surface: Surface = null
    color: number = 0xffffff
    colorPriority: number = 0
    requiredTool: RaiderTool = null
    requiredSkill: RaiderSkill = null

    protected constructor(type: JobType, surface: Surface) {
        super(type)
        this.surface = surface
    }

    isQualified(fulfiller: FulfillerEntity) {
        return (!this.requiredTool || fulfiller.hasTool(this.requiredTool))
            && (!this.requiredSkill || fulfiller.hasSkill(this.requiredSkill))
    }

    isQualifiedWithTool(fulfiller: FulfillerEntity): RaiderTool {
        return this.requiredTool
    }

    isQualifiedWithTraining(fulfiller: FulfillerEntity): RaiderSkill {
        return this.requiredSkill
    }

}
