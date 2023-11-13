export enum RaiderTraining {
    NONE = 0, // useful for truthiness checks
    DRIVER,
    ENGINEER,
    GEOLOGIST,
    PILOT,
    SAILOR,
    DEMOLITION,
}

export interface RaiderTrainingStats {
    TrainDriver: boolean[]
    TrainRepair: boolean[]
    TrainScanner: boolean[]
    TrainPilot: boolean[]
    TrainSailor: boolean[]
    TrainDynamite: boolean[]
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

    static toStatsProperty(training: RaiderTraining): keyof RaiderTrainingStats {
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

    static toToolTipIconName(training: RaiderTraining): string {
        let result
        switch (training) {
            case RaiderTraining.DRIVER:
                result = `AbilityType_Driver`
                break
            case RaiderTraining.ENGINEER:
                result = `AbilityType_Repair`
                break
            case RaiderTraining.GEOLOGIST:
                result = `AbilityType_Scanner`
                break
            case RaiderTraining.PILOT:
                result = `AbilityType_Pilot`
                break
            case RaiderTraining.SAILOR:
                result = `AbilityType_Sailor`
                break
            case RaiderTraining.DEMOLITION:
                result = `AbilityType_Dynamite`
                break
            default:
                throw new Error(`Unexpected training value given: ${training} (${RaiderTraining[training]})`)
        }
        return result.replace('_', '').toLowerCase()
    }
}
