export const RAIDER_TRAINING = {
    none: 0, // useful for truthiness checks
    driver: 1,
    engineer: 2,
    geologist: 3,
    pilot: 4,
    sailor: 5,
    demolition: 6,
} as const
export type RaiderTraining = typeof RAIDER_TRAINING[keyof typeof RAIDER_TRAINING]

export interface RaiderTrainingStats {
    trainDriver: boolean[]
    trainRepair: boolean[]
    trainScanner: boolean[]
    trainPilot: boolean[]
    trainSailor: boolean[]
    trainDynamite: boolean[]
}

export class RaiderTrainings {
    static values: RaiderTraining[] = [
        RAIDER_TRAINING.driver,
        RAIDER_TRAINING.engineer,
        RAIDER_TRAINING.geologist,
        RAIDER_TRAINING.pilot,
        RAIDER_TRAINING.sailor,
        RAIDER_TRAINING.demolition,
    ]

    static toStatsProperty(training: RaiderTraining): keyof RaiderTrainingStats {
        switch (training) {
            case RAIDER_TRAINING.driver:
                return 'trainDriver'
            case RAIDER_TRAINING.engineer:
                return 'trainRepair'
            case RAIDER_TRAINING.geologist:
                return 'trainScanner'
            case RAIDER_TRAINING.pilot:
                return 'trainPilot'
            case RAIDER_TRAINING.sailor:
                return 'trainSailor'
            case RAIDER_TRAINING.demolition:
                return 'trainDynamite'
            default:
                throw new Error(`Unexpected training value given: (${training})`)
        }
    }

    static toToolTipIconName(training: RaiderTraining): string {
        let result = ''
        switch (training) {
            case RAIDER_TRAINING.driver:
                result = `AbilityType_Driver`
                break
            case RAIDER_TRAINING.engineer:
                result = `AbilityType_Repair`
                break
            case RAIDER_TRAINING.geologist:
                result = `AbilityType_Scanner`
                break
            case RAIDER_TRAINING.pilot:
                result = `AbilityType_Pilot`
                break
            case RAIDER_TRAINING.sailor:
                result = `AbilityType_Sailor`
                break
            case RAIDER_TRAINING.demolition:
                result = `AbilityType_Dynamite`
                break
            default:
                throw new Error(`Unexpected training value given: (${training})`)
        }
        return result.replace('_', '').toLowerCase()
    }
}
