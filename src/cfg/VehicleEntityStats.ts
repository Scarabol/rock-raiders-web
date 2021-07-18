import { BaseConfig } from './BaseConfig'

export class VehicleEntityStats extends BaseConfig {

    PickSphere: number = 0
    CanDoubleSelect: boolean = false
    CostOre: number = 0
    CostCrystal: number = 0
    InvisibleDriver: boolean = false
    EngineSound: string = ''
    CanClearRubble: boolean = false
    RouteSpeed: number | number[] = 1

}
