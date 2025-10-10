export const RAIDER_TOOL = {
    none: '', // useful for truthiness checks
    drill: 'ToolType_Drill',
    hammer: 'ToolType_Hammer',
    shovel: 'ToolType_Spade',
    spanner: 'ToolType_Spanner',
    freezerGun: 'ToolType_FreezerGun',
    laser: 'ToolType_Laser',
    pusherGun: 'ToolType_PusherGun',
    birdScarer: 'ToolType_BirdScarer',
}
export type RaiderTool = typeof RAIDER_TOOL[keyof typeof RAIDER_TOOL]

export class RaiderTools {
    static values: RaiderTool[] = [
        RAIDER_TOOL.drill,
        RAIDER_TOOL.hammer,
        RAIDER_TOOL.shovel,
        RAIDER_TOOL.spanner,
        RAIDER_TOOL.freezerGun,
        RAIDER_TOOL.laser,
        RAIDER_TOOL.pusherGun,
        RAIDER_TOOL.birdScarer,
    ]

    static toToolTipIconName(tool: RaiderTool): string {
        return tool.replace('_', '').toLowerCase()
    }

    static toInterfaceItemKey(tool: RaiderTool): string {
        switch (tool) {
            case RAIDER_TOOL.drill:
                return 'Interface_MenuItem_GetDrill'
            case RAIDER_TOOL.shovel:
                return 'Interface_MenuItem_GetSpade'
            case RAIDER_TOOL.hammer:
                return 'Interface_MenuItem_GetHammer'
            case RAIDER_TOOL.spanner:
                return 'Interface_MenuItem_GetSpanner'
            case RAIDER_TOOL.freezerGun:
                return 'Interface_MenuItem_GetFreezerGun'
            case RAIDER_TOOL.laser:
                return 'Interface_MenuItem_GetLaser'
            case RAIDER_TOOL.pusherGun:
                return 'Interface_MenuItem_GetPusherGun'
            case RAIDER_TOOL.birdScarer:
                return 'Interface_MenuItem_GetBirdScarer'
            default:
                throw new Error(`Unexpected raider tool given: ${tool}`)
        }
    }
}
