export class RaiderTraining {

    static DRIVER = new RaiderTraining('driver')
    static ENGINEER = new RaiderTraining('engineer')
    static GEOLOGIST = new RaiderTraining('geologist')
    static PILOT = new RaiderTraining('pilot')
    static SAILOR = new RaiderTraining('sailor')
    static DEMOLITION = new RaiderTraining('demolition')

    name: string

    constructor(name: string) {
        this.name = name
    }

}
