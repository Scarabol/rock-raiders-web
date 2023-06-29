import { EntityManager } from '../../../EntityManager'
import { BuildingEntity } from '../../building/BuildingEntity'
import { PathTarget } from '../../PathTarget'
import { RaiderTool } from '../../raider/RaiderTool'
import { RaiderJob } from './RaiderJob'
import { Raider } from '../../raider/Raider'
import { VehicleEntity } from '../../vehicle/VehicleEntity'
import { BubblesCfg } from '../../../../cfg/BubblesCfg'

export class GetToolJob extends RaiderJob {
    entityMgr: EntityManager
    tool: RaiderTool
    workplaces: PathTarget[]

    constructor(entityMgr: EntityManager, tool: RaiderTool, toolstation: BuildingEntity) {
        super()
        this.entityMgr = entityMgr
        this.tool = tool
        this.workplaces = toolstation ? [toolstation.getToolPathTarget] : this.entityMgr.getGetToolTargets()
    }

    getWorkplace(entity: Raider | VehicleEntity): PathTarget {
        if (this.workplaces.some((b) => !b.building.isPowered())) {
            this.workplaces = this.entityMgr.getGetToolTargets()
        }
        return entity.findShortestPath(this.workplaces)?.target
    }

    onJobComplete() {
        super.onJobComplete()
        this.raider.addTool(this.tool)
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
            case RaiderTool.FREEZERGUN:
                return 'bubbleCollectFreezer'
            case RaiderTool.LASER:
                return 'bubbleCollectLaser'
            case RaiderTool.PUSHERGUN:
                return 'bubbleCollectPusher'
            case RaiderTool.BIRDSCARER:
                return 'bubbleCollectBirdScarer'
        }
        return null
    }
}
