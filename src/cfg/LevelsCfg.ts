import { PriorityIdentifier } from '../game/model/job/PriorityIdentifier'
import { BaseConfig } from './BaseConfig'
import { LevelObjectiveTextEntry } from '../resource/fileparser/ObjectiveTextParser'

export class LevelsCfg extends BaseConfig {
    levelCfgByName: Map<string, LevelEntryCfg> = new Map()

    setFromCfgObj(cfgObj: any): this {
        Object.keys(cfgObj).forEach((levelName) => {
            if (!levelName.startsWith('Tutorial') && !levelName.startsWith('Level')) return // ignore incomplete test levels and duplicates
            this.levelCfgByName.set(levelName, new LevelEntryCfg().setFromCfgObj(cfgObj[levelName]))
        })
        return this
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
    disableEndTeleport: boolean = false
    disableStartTeleport: boolean = false
    emergeTimeOut: number = 0
    boulderAnimation: any = ''
    noMultiSelect: boolean = false
    noAutoEat: boolean = false
    disableToolTipSound: boolean = false
    blockSize: number = 40
    digDepth: number = 40
    roughLevel: number = 6
    roofHeight: number = 40
    useRoof: string = ''
    selBoxHeight: number = 10
    fpRotLightRGB: number[] = [0, 0, 0]
    fogColourRGB: number[] = [0, 0, 0]
    highFogColourRGB: number[] = [0, 0, 0]
    fogRate: number = 0
    fallinMultiplier: number = 0
    numberOfLandSlidesTillCaveIn: number = 0 // TODO after this number of fallins the area of effect is increased from 1 to 6
    noFallins: boolean = false // this does not disable fallins, compare with level05
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
    textureSet: string = null
    rockFallStyle: string = ''
    emergeCreature: string = ''
    safeCaverns: boolean = true
    seeThroughWalls: boolean = false
    oListFile: string = ''
    ptlFile: string = ''
    nerpFile: string = ''
    nerpMessageFile: string = ''
    objectiveText: string = ''
    objectiveTextCfg: LevelObjectiveTextEntry = null
    objectiveImage640x480: ObjectiveImageCfg = null
    erodeTriggerTime: number = 0 // 1, 20, 40, 60, 120 time in seconds until erosion starts on next surface
    erodeErodeTime: number = 0 // 1, 5, 7, 20, 30, 40, 60 time in seconds until next erosion level is reached
    erodeLockTime: number = 0 // 1, 300, 500, 600 grace time no erosion happens on surface with power path
    nextLevel: any = ''
    levelLinks: string[] = []
    frontEndX: number = 0
    frontEndY: number = 0
    frontEndOpen: boolean = false
    priorities: LevelPrioritiesEntryConfig[] = [] // priority order matters!
    reward: LevelRewardConfig = null
    menuBMP: string[] = []

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey === 'fullName'.toLowerCase()) {
            return cfgValue.replace(/_/g, ' ')
        } else if (unifiedKey === 'priorities') {
            return Object.entries<boolean>(cfgValue)
                .filter(([name]) => !name.equalsIgnoreCase('AI_Priority_GetTool')) // not used in the game
                .map(([name, enabled]) => new LevelPrioritiesEntryConfig(name, enabled))
        } else if (unifiedKey === 'reward') {
            return new LevelRewardConfig().setFromCfgObj(cfgValue)
        } else if (unifiedKey === 'objectiveimage640x480') {
            return new ObjectiveImageCfg(cfgValue)
        } else if (unifiedKey === 'textureset') {
            return (Array.isArray(cfgValue) ? cfgValue[0] : cfgValue).toLowerCase()
        } else if (unifiedKey === 'rockfallstyle') { // value given twice for level07
            return (Array.isArray(cfgValue) ? cfgValue[0] : cfgValue).toLowerCase()
        } else if (unifiedKey === 'emergecreature') { // value given twice for level20
            return (Array.isArray(cfgValue) ? cfgValue[0] : cfgValue).toLowerCase()
        } else {
            return super.parseValue(unifiedKey, cfgValue)
        }
    }
}

export class LevelPrioritiesEntryConfig {
    key: PriorityIdentifier
    enabled: boolean

    constructor(name: string, enabled: boolean) {
        this.key = LevelPrioritiesEntryConfig.priorityIdentifierFromString(name)
        this.enabled = enabled
    }

    private static priorityIdentifierFromString(name: string) {
        if (name.equalsIgnoreCase('AI_Priority_Train')) {
            return PriorityIdentifier.TRAIN
        } else if (name.equalsIgnoreCase('AI_Priority_GetIn')) {
            return PriorityIdentifier.GET_IN
        } else if (name.equalsIgnoreCase('AI_Priority_Crystal')) {
            return PriorityIdentifier.CRYSTAL
        } else if (name.equalsIgnoreCase('AI_Priority_Ore')) {
            return PriorityIdentifier.ORE
        } else if (name.equalsIgnoreCase('AI_Priority_Repair')) {
            return PriorityIdentifier.REPAIR
        } else if (name.equalsIgnoreCase('AI_Priority_Clearing')) {
            return PriorityIdentifier.CLEARING
        } else if (name.equalsIgnoreCase('AI_Priority_Destruction')) {
            return PriorityIdentifier.DESTRUCTION
        } else if (name.equalsIgnoreCase('AI_Priority_Construction')) {
            return PriorityIdentifier.CONSTRUCTION
        } else if (name.equalsIgnoreCase('AI_Priority_Reinforce')) {
            return PriorityIdentifier.REINFORCE
        } else if (name.equalsIgnoreCase('AI_Priority_Recharge')) {
            return PriorityIdentifier.RECHARGE
        } else {
            throw new Error(`Unexpected priority identifier ${name}`)
        }
    }
}

export class LevelRewardConfig extends BaseConfig {
    enable: boolean = true
    modifier: number = null
    importance: LevelRewardImportanceConfig = null
    quota: LevelRewardQuotaConfig = null

    parseValue(unifiedKey: string, cfgValue: any): any {
        if (unifiedKey === 'importance') {
            return new LevelRewardImportanceConfig().setFromCfgObj(cfgValue)
        } else if (unifiedKey === 'quota') {
            return new LevelRewardQuotaConfig().setFromCfgObj(cfgValue)
        } else {
            return super.parseValue(unifiedKey, cfgValue)
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
}

export class LevelRewardQuotaConfig extends BaseConfig {
    crystals: number = 0
    timer: number = 0
    caverns: number = 0
    constructions: number = 0
}

export class ObjectiveImageCfg {
    filename: string
    x: number
    y: number

    constructor(cfgValue: any) {
        [this.filename, this.x, this.y] = cfgValue
    }
}
