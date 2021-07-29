export enum RaiderTraining {
    NONE,
    DRIVER,
    ENGINEER,
    GEOLOGIST,
    PILOT,
    SAILOR,
    DEMOLITION,
}

export class RaiderTrainings {
    static values: RaiderTraining[] = [
        RaiderTraining.DRIVER,
        RaiderTraining.ENGINEER,
        RaiderTraining.GEOLOGIST,
        RaiderTraining.PILOT,
        RaiderTraining.SAILOR,
        RaiderTraining.DEMOLITION,
    ]

    static toStatsProperty(training: RaiderTraining): string {
        switch (training) {
            case RaiderTraining.DRIVER:
                return 'TrainDriver'
            case RaiderTraining.ENGINEER:
                return 'TrainRepair'
            case RaiderTraining.GEOLOGIST:
                return 'TrainScanner'
            case RaiderTraining.PILOT:
                return 'TrainPilot'
            case RaiderTraining.SAILOR:
                return 'TrainSailor'
            case RaiderTraining.DEMOLITION:
                return 'TrainDynamite'
            default:
                throw new Error(`Unexpected training value given: ${training} (${RaiderTraining[training]})`)
        }
    }
}
