import { BaseConfig } from './BaseConfig'

export class BuildingEntityStats extends BaseConfig {

    Levels: number = 0
    SelfPowered: boolean = false
    PowerBuilding: boolean = false
    PickSphere: number = 0
    TrainDynamite: boolean[] = null
    CostOre: number = 0
    CostCrystal: number = 0
    OxygenCoef: number = 0

}
