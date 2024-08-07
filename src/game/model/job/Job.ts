import { AnimationActivity } from '../anim/AnimationActivity'
import { Surface } from '../../terrain/Surface'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { JobState } from './JobState'
import { BubblesCfg } from '../../../cfg/BubblesCfg'
import { PriorityIdentifier } from './PriorityIdentifier'
import { Sample } from '../../../audio/Sample'
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
    stopJob(): void
    dropCarried(unAssign: boolean): MaterialEntity[]
    getDrillTimeSeconds(surface: Surface): number
    getRepairValue(): number
}

export abstract class Job {
    jobState: JobState = JobState.INCOMPLETE
    surface?: Surface
    carryItem?: MaterialEntity
    requiredTool: RaiderTool = RaiderTool.NONE
    requiredTraining: RaiderTraining = RaiderTraining.NONE
    priorityIdentifier: PriorityIdentifier = PriorityIdentifier.NONE
    workSoundRaider?: Sample
    workSoundVehicle?: Sample

    abstract assign(fulfiller: JobFulfiller): void

    abstract unAssign(fulfiller: JobFulfiller): void

    abstract hasFulfiller(): boolean

    isReadyToComplete(): boolean {
        return true
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.jobState = JobState.COMPLETE
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
