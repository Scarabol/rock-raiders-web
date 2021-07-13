export class RaiderTool {

    static readonly values: RaiderTool[] = []

    static readonly DRILL = new RaiderTool()
    static readonly HAMMER = new RaiderTool()
    static readonly SHOVEL = new RaiderTool()
    static readonly SPANNER = new RaiderTool()
    static readonly FREEZERGUN = new RaiderTool()
    static readonly LASER = new RaiderTool()
    static readonly PUSHERGUN = new RaiderTool()
    static readonly BIRDSCARER = new RaiderTool()

    private constructor() {
        RaiderTool.values.push(this)
    }

}
