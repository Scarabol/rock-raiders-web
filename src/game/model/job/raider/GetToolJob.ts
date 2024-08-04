import { EntityManager } from '../../../EntityManager'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { RaiderJob } from './RaiderJob'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'
import { JobFulfiller } from '../Job'
import { MoveJob } from '../MoveJob'

export class GetToolJob extends RaiderJob {
    entityMgr: EntityManager
    tool: RaiderTool
    workplaces: PathTarget[]

    constructor(entityMgr: EntityManager, tool: RaiderTool, toolstation?: BuildingEntity) {
        super()
        this.entityMgr = entityMgr
        this.tool = tool
        this.workplaces = toolstation ? [toolstation.getToolPathTarget] : this.entityMgr.getGetToolTargets()
    }

    getWorkplace(entity: JobFulfiller): PathTarget {
        if (this.workplaces.some((b) => !b.building.isPowered())) {
            this.workplaces = this.entityMgr.getGetToolTargets()
        }
        return entity.findShortestPath(this.workplaces)?.target
    }

    onJobComplete(fulfiller: JobFulfiller): void {
        super.onJobComplete(fulfiller)
        this.raider.addTool(this.tool)
        if (!this.raider.followUpJob) {
            const building = this.raider.getSurface().building
            if (building) {
                const walkableSurface = building.primaryPathSurface?.neighbors.find((n) => n.isWalkable())
                if (walkableSurface) this.raider.followUpJob = new MoveJob(walkableSurface.getRandomPosition())
            }
        }
    }

    getJobBubble(): keyof BubblesCfg {
        switch (this.tool) {
            case RaiderTool.DRILL:
                return 'bubbleCollectDrill'
            case RaiderTool.HAMMER:
                return 'bubbleCollectHammer'
            case RaiderTool.SHOVEL:
                return 'bubbleCollectSpade'
            case RaiderTool.SPANNER:
                return 'bubbleCollectSpanner'
            case RaiderTool.FREEZER_GUN:
                return 'bubbleCollectFreezer'
            case RaiderTool.LASER:
                return 'bubbleCollectLaser'
            case RaiderTool.PUSHER_GUN:
                return 'bubbleCollectPusher'
            case RaiderTool.BIRD_SCARER:
                return 'bubbleCollectBirdScarer'
        }
        return null
    }
}
