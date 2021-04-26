export class RaiderSkill {

    static DRIVER = new RaiderSkill('driver')
    static ENGINEER = new RaiderSkill('engineer')
    static GEOLOGIST = new RaiderSkill('geologist')
    static PILOT = new RaiderSkill('pilot')
    static SAILOR = new RaiderSkill('sailor')
    static DEMOLITION = new RaiderSkill('demolition')

    name: string

    constructor(name: string) {
        this.name = name
    }

}
