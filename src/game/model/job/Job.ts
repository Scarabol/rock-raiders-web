import { AnimationActivity } from '../anim/AnimationActivity'
import { Surface } from '../../terrain/Surface'
import { MaterialEntity } from '../material/MaterialEntity'
import { PathTarget } from '../PathTarget'
import { Raider } from '../raider/Raider'
import { RaiderTool } from '../raider/RaiderTool'
import { RaiderTraining } from '../raider/RaiderTraining'
import { VehicleEntity } from '../vehicle/VehicleEntity'
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

    findShortestPath(targets: PathTarget[] | PathTarget): TerrainPath
    stopJob(): void
    dropCarried(unAssign: boolean): MaterialEntity[]
    getDrillTimeSeconds(surface: Surface): number
    getRepairValue(): number
}

export abstract class Job {
    jobState: JobState = JobState.INCOMPLETE
    surface: Surface = null
    carryItem: MaterialEntity = null
    requiredTool: RaiderTool = RaiderTool.NONE
    requiredTraining: RaiderTraining = RaiderTraining.NONE
    priorityIdentifier: PriorityIdentifier = PriorityIdentifier.NONE
    workSoundRaider: Sample = null
    workSoundVehicle: Sample = null

    abstract assign(fulfiller: JobFulfiller): void

    abstract unAssign(fulfiller: JobFulfiller): void

    abstract hasFulfiller(): boolean

    isReadyToComplete(): boolean {
        return true
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        this.jobState = JobState.COMPLETE
    }

    abstract getWorkplace(entity: Raider | VehicleEntity): PathTarget

    getWorkActivity(): AnimationActivity {
        return null
    }

    getExpectedTimeLeft(): number {
        return null
    }

    getJobBubble(): keyof BubblesCfg {
        return null
    }
}
