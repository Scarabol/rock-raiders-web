import { BaseConfig } from './BaseConfig'
import { ConfigColor } from './ConfigColor'

export class LevelsCfg {

    levelsByName: {} = []

    constructor(cfgObj: any) {
        Object.keys(cfgObj).forEach((levelKey) => {
            if (!levelKey.startsWith('Tutorial') && !levelKey.startsWith('Level')) return // ignore incomplete test levels and duplicates
            this.levelsByName[levelKey] = new LevelEntryCfg(cfgObj[levelKey])
        })
    }

}

export class LevelEntryCfg extends BaseConfig {

    fullName: string = ''
    endGameAvi1: string = ''
    endGameAvi2: string = ''
    allowRename: boolean = false
    recallOLObjects: boolean = false
    generateSpiders: boolean = false
    video: string = ''
    disableEndTeleport: any = ''
    disableStartTeleport: any = ''
    emergeTimeOut: any = ''
    boulderAnimation: any = ''
    noMultiSelect: any = ''
    noAutoEat: any = ''
    disableToolTipSound: any = ''
    blockSize: any = ''
    digDepth: any = ''
    roughLevel: any = ''
    roofHeight: any = ''
    useRoof: any = ''
    selBoxHeight: any = ''
    fpRotLightRGB: any = ''
    fogColourRGB: any = ''
    highFogColourRGB: any = ''
    fogRate: number = 0
    fallinMultiplier: number = 0
    numberOfLandSlidesTillCaveIn: number = 0
    noFallins: boolean = false
    oxygenRate: number = 0 // 0 - 100
    surfaceMap: string = ''
    predugMap: string = ''
    terrainMap: string = ''
    emergeMap: string = ''
    erodeMap: string = ''
    fallinMap: string = ''
    blockPointersMap: string = ''
    cryOreMap: string = ''
    pathMap: string = ''
    noGather: boolean = false
    textureSet: string = ''
    rockFallStyle: any = ''
    emergeCreature: any = ''
    safeCaverns: any = ''
    seeThroughWalls: any = ''
    oListFile: any = ''
    ptlFile: any = ''
    nerpFile: any = ''
    nerpMessageFile: any = ''
    objectiveText: any = ''
    objectiveImage640x480: any = ''
    erodeTriggerTime: number = 0
    erodeErodeTime: number = 0
    erodeLockTime: number = 0
    nextLevel: any = ''
    levelLinks: any = ''
    frontEndX: number = 0
    frontEndY: number = 0
    frontEndOpen: boolean = false
    priorities: LevelPrioritiesConfig = null
    reward: LevelRewardConfig = null
    menuBMP: string[] = []

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    assignValue(objKey, lCfgKeyName, cfgValue): boolean {
        return super.assignValue(objKey, lCfgKeyName, cfgValue)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        if (lCfgKeyName === 'fullName'.toLowerCase()) {
            return this.parseLabel(cfgValue)
        } else if (lCfgKeyName.endsWith('rgb')) {
            return new ConfigColor(cfgValue)
        } else if (lCfgKeyName === 'priorities') {
            return new LevelPrioritiesConfig(cfgValue)
        } else if (lCfgKeyName === 'reward') {
            return new LevelRewardConfig(cfgValue)
        } else {
            return super.parseValue(lCfgKeyName, cfgValue)
        }
    }

}

export class LevelPrioritiesConfig extends BaseConfig {

    AI_Priority_Crystal: boolean = true
    AI_Priority_Destruction: boolean = true
    AI_Priority_Clearing: boolean = true
    AI_Priority_Ore: boolean = true
    AI_Priority_Repair: boolean = true
    AI_Priority_GetIn: boolean = true
    AI_Priority_Construction: boolean = true
    AI_Priority_Reinforce: boolean = true
    AI_Priority_GetTool: boolean = true
    AI_Priority_Train: boolean = true
    AI_Priority_Recharge: boolean = true

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

}

export class LevelRewardConfig extends BaseConfig {

    enable: boolean = true
    modifier: number = null
    importance: LevelRewardImportanceConfig = null
    quota: LevelRewardQuotaConfig = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

    parseValue(lCfgKeyName: string, cfgValue: any): any {
        if (lCfgKeyName === 'importance') {
            return new LevelRewardImportanceConfig(cfgValue)
        } else if (lCfgKeyName === 'quota') {
            return new LevelRewardQuotaConfig(cfgValue)
        } else {
            return super.parseValue(lCfgKeyName, cfgValue)
        }
    }
}

export class LevelRewardImportanceConfig extends BaseConfig {

    crystals: number = 0
    timer: number = 0
    caverns: number = 0
    constructions: number = 0
    oxygen: number = 0
    figures: number = 0

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

}

export class LevelRewardQuotaConfig extends BaseConfig {

    crystals: number = null
    timer: number = null
    caverns: number = null
    constructions: number = null

    constructor(cfgObj: any) {
        super()
        BaseConfig.setFromCfg(this, cfgObj)
    }

}
