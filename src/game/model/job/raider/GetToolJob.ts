import { EntityManager } from '../../../EntityManager'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RAIDER_TOOL, RaiderTool } from '../../raider/RaiderTool'
import { RaiderJob } from './RaiderJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { JobFulfiller } from '../Job'
import { MoveJob } from '../MoveJob'
import { SurfaceType } from '../../../terrain/SurfaceType'

export class GetToolJob extends RaiderJob {
    entityMgr: EntityManager
    tool: RaiderTool
    workplaces: PathTarget[]

    constructor(entityMgr: EntityManager, tool: RaiderTool, toolstation?: BuildingEntity) {
        super()
        this.entityMgr = entityMgr
        this.tool = tool
        this.workplaces = toolstation?.getToolPathTarget ? [toolstation.getToolPathTarget] : this.entityMgr.getGetToolTargets()
    }

    getWorkplace(entity: JobFulfiller): PathTarget | undefined {
        if (this.workplaces.some((b) => !b.building?.isPowered())) {
            this.workplaces = this.entityMgr.getGetToolTargets()
        }
        return entity.findShortestPath(this.workplaces)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        if (!this.raider) return
        this.raider.addTool(this.tool)
        if (!this.raider.followUpJob) {
            const building = this.raider.getSurface().building
            if (building) {
                const pathSurface = building.primaryPathSurface?.neighbors.find((n) => n.surfaceType === SurfaceType.POWER_PATH)
                if (pathSurface) {
                    this.raider.followUpJob = new MoveJob(pathSurface.getRandomPosition())
                } else {
                    const walkableSurface = building.primaryPathSurface?.neighbors.find((n) => n.isWalkable())
                    if (walkableSurface) this.raider.followUpJob = new MoveJob(walkableSurface.getRandomPosition())
                }
            }
        }
    }

    getJobBubble(): keyof BubblesCfg {
        switch (this.tool) {
            case RAIDER_TOOL.drill:
                return 'bubbleCollectDrill'
            case RAIDER_TOOL.hammer:
                return 'bubbleCollectHammer'
            case RAIDER_TOOL.shovel:
                return 'bubbleCollectSpade'
            case RAIDER_TOOL.spanner:
                return 'bubbleCollectSpanner'
            case RAIDER_TOOL.freezerGun:
                return 'bubbleCollectFreezer'
            case RAIDER_TOOL.laser:
                return 'bubbleCollectLaser'
            case RAIDER_TOOL.pusherGun:
                return 'bubbleCollectPusher'
            case RAIDER_TOOL.birdScarer:
                return 'bubbleCollectBirdScarer'
        }
        return 'bubbleIdle'
    }
}
