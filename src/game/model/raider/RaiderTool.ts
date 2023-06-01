export enum RaiderTool {
    NONE = 0, // useful for truthiness checks
    DRILL,
    HAMMER,
    SHOVEL,
    SPANNER,
    FREEZERGUN,
    LASER,
    PUSHERGUN,
    BIRDSCARER,
}

export class RaiderTools {
    static values: RaiderTool[] = [
        RaiderTool.DRILL,
        RaiderTool.HAMMER,
        RaiderTool.SHOVEL,
        RaiderTool.SPANNER,
        RaiderTool.FREEZERGUN,
        RaiderTool.LASER,
        RaiderTool.PUSHERGUN,
        RaiderTool.BIRDSCARER,
    ]

    static toToolTipIconName(tool: RaiderTool): string {
        let result
        switch (tool) {
            case RaiderTool.DRILL:
                result = `ToolType_Drill`
                break
            case RaiderTool.HAMMER:
                result = `ToolType_Hammer`
                break
            case RaiderTool.SHOVEL:
                result = `ToolType_Spade`
                break
            case RaiderTool.SPANNER:
                result = `ToolType_Spanner`
                break
            case RaiderTool.FREEZERGUN:
                result = `ToolType_FreezerGun`
                break
            case RaiderTool.LASER:
                result = `ToolType_Laser`
                break
            case RaiderTool.PUSHERGUN:
                result = 'ToolType_PusherGun'
                break
            case RaiderTool.BIRDSCARER:
                result = 'ToolType_BirdScarer'
                break
            default:
                throw new Error(`Unexpected training value given: ${tool} (${RaiderTool[tool]})`)
        }
        return result.replace('_', '').toLowerCase()
    }
}
