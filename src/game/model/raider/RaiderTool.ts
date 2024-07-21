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
}
