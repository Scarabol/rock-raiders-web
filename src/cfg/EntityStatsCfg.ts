import { BaseConfig } from './BaseConfig'

export class EntityStatsCfg extends BaseConfig {

    levels: number = null
    routeSpeed: number[] = null
    soilDrillTime: number[] = null
    looseDrillTime: number[] = null
    medDrillTime: number[] = null
    hardDrillTime: number[] = null
    seamDrillTime: number[] = null
    upgradeTime: number[] = null
    collRadius: number = null
    collHeight: number = null
    trackDist: number = null
    singleWidthDig: boolean = null
    pickSphere: number = null
    repairValue: number[] = null
    surveyRadius: number[] = null
    drillsound: string = null
    drillfadesound: string = null
    restPercent: number = null
    energyDecayRate: number = null
    canClearRubble: boolean = null
    numOfToolsCanCarry: number[] = null
    crossLand: boolean = null
    rubbleCoef: number = 1
    pathCoef: number = 1
    routeAvoidance: boolean = null
    useLegoManTeleporter: boolean = null
    awarenessRange: number = null
    oxygenCoef: number = 0
    canStrafe: boolean = null
    enterToolStore: boolean = null
    showHealthBar: boolean = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        if (lCfgKeyName === 'routeSpeed' ||
            lCfgKeyName === 'soilDrillTime' ||
            lCfgKeyName === 'looseDrillTime' ||
            lCfgKeyName === 'medDrillTime' ||
            lCfgKeyName === 'hardDrillTime' ||
            lCfgKeyName === 'seamDrillTime' ||
            lCfgKeyName === 'upgradeTime' ||
            lCfgKeyName === 'repairValue' ||
            lCfgKeyName === 'surveyRadius' ||
            lCfgKeyName === 'numOfToolsCanCarry') {
            return Array.isArray(cfgValue) ? cfgValue : [cfgValue]
        }
        return super.parseValue(lCfgKeyName, cfgValue)
    }

}
