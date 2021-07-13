export class RaiderTraining {

    static readonly values: RaiderTraining[] = []

    static readonly DRIVER = new RaiderTraining('TrainDriver')
    static readonly ENGINEER = new RaiderTraining('TrainRepair')
    static readonly GEOLOGIST = new RaiderTraining('TrainScanner')
    static readonly PILOT = new RaiderTraining('TrainPilot')
    static readonly SAILOR = new RaiderTraining('TrainSailor')
    static readonly DEMOLITION = new RaiderTraining('TrainDynamite')

    private constructor(readonly statsName: string) {
        RaiderTraining.values.push(this)
    }

}
