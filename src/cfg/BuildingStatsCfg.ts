import { BaseConfig } from './BaseConfig'

export class BuildingStatsCfg extends BaseConfig {

    levels: number = 0
    surveyRadius: number[] = null
    trackDist: number = 0
    smallTeleporter: boolean = false
    manTeleporter: boolean = false
    processCrystal: boolean = false
    collHeight: number = 0
    collRadius: number = 0
    pickSphere: number = 0
    costOre: number = 0
    costRefinedOre: number = 0
    costCrystal: number = 0
    toolStore: boolean = false
    storeObjects: boolean = false
    selfPowered: boolean = false
    powerBuilding: boolean = false
    snaxULike: boolean = false
    crystalDrain: number[] = null
    damageCausesCallToArms: boolean = true
    trainDriver: boolean[] = null
    trainScanner: boolean[] = null
    trainPilot: boolean[] = null
    trainDynamite: boolean[] = null
    functionCoef: number[] = null
    oxygenCoef: number = 0
    engineSound: string = null
    showHealthBar: boolean = false
    tracker: boolean = false
    canDoubleSelect: boolean = false

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

}
