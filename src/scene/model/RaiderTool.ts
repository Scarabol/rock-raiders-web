export class RaiderTool {

    static DRILL = new RaiderTool('drill')
    static HAMMER = new RaiderTool('hammer')
    static SHOVEL = new RaiderTool('shovel')
    static SPANNER = new RaiderTool('spanner')
    static FREEZERGUN = new RaiderTool('freezergun')
    static LASER = new RaiderTool('laser')
    static PUSHERGUN = new RaiderTool('pushergun')
    static BIRDSCARER = new RaiderTool('birdscarer')

    name: string

    constructor(name: string) {
        this.name = name
    }

}
