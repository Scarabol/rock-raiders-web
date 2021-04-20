import { RaiderTool } from '../../../scene/model/RaiderTool'
import { RaiderSkill } from '../../../scene/model/RaiderSkill'
import { PriorityIdentifier } from './PriorityIdentifier'

export class SurfaceJobType {

    static readonly DRILL = new SurfaceJobType(0xa0a0a0, 0, RaiderTool.DRILL, null, PriorityIdentifier.aiPriorityDestruction)
    static readonly REINFORCE = new SurfaceJobType(0x60a060, 1, RaiderTool.HAMMER, null, PriorityIdentifier.aiPriorityReinforce)
    static readonly BLOW = new SurfaceJobType(0xa06060, 2, null, RaiderSkill.DEMOLITION, PriorityIdentifier.aiPriorityDestruction)
    static readonly CLEAR_RUBBLE = new SurfaceJobType(0xffffff, 0, RaiderTool.SHOVEL, null, PriorityIdentifier.aiPriorityClearing)

    color: number
    colorPriority: number
    requiredTool: RaiderTool
    requiredSkill: RaiderSkill
    priorityIdentifier: PriorityIdentifier

    constructor(color: number, colorPriority: number, requiredTool: RaiderTool, requiredSkill: RaiderSkill, priorityIdentifier: PriorityIdentifier) {
        this.color = color
        this.colorPriority = colorPriority
        this.requiredTool = requiredTool
        this.requiredSkill = requiredSkill
        this.priorityIdentifier = priorityIdentifier
    }

}
