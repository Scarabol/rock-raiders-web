export enum RaiderTool {
    NONE = '', // useful for truthiness checks
    DRILL = 'ToolType_Drill',
    HAMMER = 'ToolType_Hammer',
    SHOVEL = 'ToolType_Spade',
    SPANNER = 'ToolType_Spanner',
    FREEZER_GUN = 'ToolType_FreezerGun',
    LASER = 'ToolType_Laser',
    PUSHER_GUN = 'ToolType_PusherGun',
    BIRD_SCARER = 'ToolType_BirdScarer',
}

export class RaiderTools {
    static values: RaiderTool[] = [
        RaiderTool.DRILL,
        RaiderTool.HAMMER,
        RaiderTool.SHOVEL,
        RaiderTool.SPANNER,
        RaiderTool.FREEZER_GUN,
        RaiderTool.LASER,
        RaiderTool.PUSHER_GUN,
        RaiderTool.BIRD_SCARER,
    ]

    static toToolTipIconName(tool: RaiderTool): string {
        return tool.replace('_', '').toLowerCase()
    }

    static toInterfaceItemKey(tool: RaiderTool): string {
        switch (tool) {
            case RaiderTool.DRILL:
                return 'Interface_MenuItem_GetDrill'
            case RaiderTool.SHOVEL:
                return 'Interface_MenuItem_GetSpade'
            case RaiderTool.HAMMER:
                return 'Interface_MenuItem_GetHammer'
            case RaiderTool.SPANNER:
                return 'Interface_MenuItem_GetSpanner'
            case RaiderTool.FREEZER_GUN:
                return 'Interface_MenuItem_GetFreezerGun'
            case RaiderTool.LASER:
                return 'Interface_MenuItem_GetLaser'
            case RaiderTool.PUSHER_GUN:
                return 'Interface_MenuItem_GetPusherGun'
            case RaiderTool.BIRD_SCARER:
                return 'Interface_MenuItem_GetBirdScarer'
            default:
                throw new Error(`Unexpected raider tool given: ${tool}`)
        }
    }
}
