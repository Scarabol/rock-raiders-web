import { EntityType } from '../EntityType'

export enum RaiderTraining {
    NONE,
    DRIVER,
    ENGINEER,
    GEOLOGIST,
    PILOT,
    SAILOR,
    DEMOLITION,
}

export const AllRaiderTrainings: RaiderTraining[] = [
    RaiderTraining.DRIVER,
    RaiderTraining.ENGINEER,
    RaiderTraining.GEOLOGIST,
    RaiderTraining.PILOT,
    RaiderTraining.SAILOR,
    RaiderTraining.DEMOLITION,
]

export const RaiderTrainingSites: EntityType[] = []
RaiderTrainingSites[RaiderTraining.DRIVER] = EntityType.BARRACKS
RaiderTrainingSites[RaiderTraining.DRIVER] = EntityType.BARRACKS
RaiderTrainingSites[RaiderTraining.ENGINEER] = EntityType.UPGRADE
RaiderTrainingSites[RaiderTraining.GEOLOGIST] = EntityType.GEODOME
RaiderTrainingSites[RaiderTraining.PILOT] = EntityType.TELEPORT_PAD
RaiderTrainingSites[RaiderTraining.SAILOR] = EntityType.DOCKS
RaiderTrainingSites[RaiderTraining.DEMOLITION] = EntityType.TOOLSTATION

export const RaiderTrainingStatsProperty: string[] = []
RaiderTrainingStatsProperty[RaiderTraining.DRIVER] = 'TrainDriver'
RaiderTrainingStatsProperty[RaiderTraining.ENGINEER] = 'TrainRepair'
RaiderTrainingStatsProperty[RaiderTraining.GEOLOGIST] = 'TrainScanner'
RaiderTrainingStatsProperty[RaiderTraining.PILOT] = 'TrainPilot'
RaiderTrainingStatsProperty[RaiderTraining.SAILOR] = 'TrainSailor'
RaiderTrainingStatsProperty[RaiderTraining.DEMOLITION] = 'TrainDynamite'
