import { RaiderTraining } from '../game/model/raider/RaiderTraining'
import { BaseConfig } from './BaseConfig'

export class VehicleEntityStats extends BaseConfig {

    PickSphere: number = 0
    CanDoubleSelect: boolean = false
    CostOre: number = 0
    CostCrystal: number = 0
    InvisibleDriver: boolean = false
    EngineSound: string = ''
    CanClearRubble: boolean = false
    RouteSpeed: number[] = []
    CrossLand: boolean = false
    CrossWater: boolean = false
    CrossLava: boolean = false

    getRequiredTraining(): RaiderTraining {
        if (this.CrossLand && !this.CrossLava && !this.CrossWater) {
            return RaiderTraining.DRIVER
        } else if (this.CrossWater) {
            return RaiderTraining.SAILOR
        }
        return RaiderTraining.PILOT
    }

}
