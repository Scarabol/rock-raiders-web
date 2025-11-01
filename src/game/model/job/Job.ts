import { AnimationActivity } from '../anim/AnimationActivity'
import { Surface } from '../../terrain/Surface'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { RAIDER_TOOL, RaiderTool } from '../raider/RaiderTool'
import { RAIDER_TRAINING, RaiderTraining } from '../raider/RaiderTraining'
import { JOB_STATE, JobState } from './JobState'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { PRIORITY_IDENTIFIER, PriorityIdentifier } from './PriorityIdentifier'
import { AnimatedSceneEntity } from '../../../scene/AnimatedSceneEntity'
import { EntityType } from '../EntityType'
import { TerrainPath } from '../../terrain/TerrainPath'
import { GameEntity } from '../../ECS'
import { PickSphereStats } from '../../../cfg/GameStatsCfg'

export interface JobFulfiller {
    entity: GameEntity
    entityType: EntityType
    sceneEntity: AnimatedSceneEntity
    stats: PickSphereStats

    findShortestPath(targets: PathTarget[] | PathTarget | undefined): TerrainPath | undefined
    setJob(job: Job, followUpJob?: Job): void
    stopJob(): void
    dropCarried(unAssign: boolean): MaterialEntity[]
    getDrillTimeSeconds(surface: Surface): number
    getRepairValue(): number
}

export abstract class Job {
    jobState: JobState = JOB_STATE.incomplete
    surface: Surface | undefined
    carryItem: MaterialEntity | undefined
    requiredTool: RaiderTool = RAIDER_TOOL.none
    requiredTraining: RaiderTraining = RAIDER_TRAINING.none
    priorityIdentifier: PriorityIdentifier = PRIORITY_IDENTIFIER.none
    workSoundRaider: string | undefined
    workSoundVehicle: string | undefined
    doOnAlarm: boolean = false

    abstract assign(fulfiller: JobFulfiller): void

    abstract unAssign(fulfiller: JobFulfiller): void

    abstract hasFulfiller(): boolean

    isReadyToComplete(): boolean {
        return true
    }

    onJobComplete(_fulfiller: JobFulfiller): void {
        this.jobState = JOB_STATE.complete
    }

    abstract getWorkplace(entity: JobFulfiller): PathTarget | undefined

    getWorkActivity(): AnimationActivity | undefined {
        return undefined
    }

    getExpectedTimeLeft(): number | undefined {
        return undefined
    }

    getJobBubble(): keyof BubblesCfg | undefined {
        return undefined
    }
}
