import { PriorityIdentifier } from '../game/model/job/PriorityIdentifier'
import { GameConfig } from './GameConfig'
import { SaveGameManager } from '../resource/SaveGameManager'
import { VERBOSE } from '../params'
import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'

export class LevelEntryCfg implements ConfigSetFromRecord {
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
    useRoof: boolean = true
    selBoxHeight: number = 10
    fpRotLightRGB: [r: number, g: number, b: number] = [0, 0, 0]
    fogColourRGB: [r: number, g: number, b: number] = [0, 0, 0]
    highFogColourRGB: [r: number, g: number, b: number] = [0, 0, 0]
    fogRate: number = 0
    fallinMultiplier: number = 0 // time in seconds that is multiplied with fall in map value to get time between fall ins
    numberOfLandSlidesTillCaveIn: number = 0 // TODO after this number of fallins the area of effect is increased from 1 to 6
    noFallins: boolean = false // this does not disable fallins, compare with level05
    oxygenRate: number = 0 // 0 - 100 with the highest usage at 100 and lowest at 0
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
    rockFallStyle: string = ''
    emergeCreature: string = ''
    safeCaverns: boolean = true
    seeThroughWalls: boolean = false
    oListFile: string = ''
    ptlFile: string = ''
    nerpFile: string = ''
    nerpMessageFile: string = ''
    objectiveText: string = ''
    objectiveImage640x480?: ObjectiveImageCfg
    erodeTriggerTime: number = 0 // 1, 20, 40, 60, 120 time in seconds to trigger a new erosion
    erodeErodeTime: number = 0 // 1, 5, 7, 20, 30, 40, 60 time in seconds until next erosion level is reached
    erodeLockTime: number = 0 // 1, 300, 500, 600 grace time no erosion happens on surface with power path
    nextLevel: any = ''
    levelLinks: string[] = []
    frontEndX: number = 0
    frontEndY: number = 0
    frontEndOpen: boolean = false
    priorities: LevelPrioritiesEntryConfig[] = [] // priority order matters!
    reward?: LevelRewardConfig
    menuBMP: string[] = []

    constructor(readonly levelName: string) {
    }

    setFromRecord(cfgValue: CfgEntry): this {
        this.fullName = cfgValue.getValue('FullName').toLabel()
        this.endGameAvi1 = cfgValue.getValue('EndGameAvi1').toFileName()
        this.endGameAvi2 = cfgValue.getValue('EndGameAvi2').toFileName()
        this.allowRename = cfgValue.getValue('AllowRename').toBoolean()
        this.recallOLObjects = cfgValue.getValue('RecallOLObjects').toBoolean()
        this.generateSpiders = cfgValue.getValue('GenerateSpiders').toBoolean()
        this.video = cfgValue.getValue('Video').toFileName()
        this.disableEndTeleport = cfgValue.getValue('DisableEndTeleport').toBoolean()
        this.disableStartTeleport = cfgValue.getValue('DisableStartTeleport').toBoolean()
        this.emergeTimeOut = cfgValue.getValue('EmergeTimeOut').toNumber()
        this.boulderAnimation = cfgValue.getValue('BoulderAnimation').toFileName()
        this.noMultiSelect = cfgValue.getValue('NoMultiSelect').toBoolean()
        this.noAutoEat = cfgValue.getValue('NoAutoEat').toBoolean()
        this.disableToolTipSound = cfgValue.getValue('DisableToolTipSound').toBoolean()
        this.blockSize = cfgValue.getValue('BlockSize').toNumber()
        this.digDepth = cfgValue.getValue('DigDepth').toNumber()
        this.roughLevel = cfgValue.getValue('RoughLevel').toNumber()
        this.roofHeight = cfgValue.getValue('RoofHeight').toNumber()
        this.useRoof = cfgValue.getValue('UseRoof').toBoolean()
        this.selBoxHeight = cfgValue.getValue('SelBoxHeight').toNumber()
        this.fpRotLightRGB = cfgValue.getValue('FpRotLightRGB').toRGB(this.fpRotLightRGB)
        this.fogColourRGB = cfgValue.getValue('FogColourRGB').toRGB()
        this.highFogColourRGB = cfgValue.getValue('HighFogColourRGB').toRGB()
        this.fogRate = cfgValue.getValue('FogRate').toNumber()
        this.fallinMultiplier = cfgValue.getValue('FallinMultiplier').toNumber()
        this.numberOfLandSlidesTillCaveIn = cfgValue.getValue('NumberOfLandSlidesTillCaveIn').toNumber()
        this.noFallins = cfgValue.getValue('NoFallins').toBoolean()
        this.oxygenRate = cfgValue.getValue('OxygenRate').toNumber()
        this.surfaceMap = cfgValue.getValue('SurfaceMap').toFileName()
        this.predugMap = cfgValue.getValue('PredugMap').toFileName()
        this.terrainMap = cfgValue.getValue('TerrainMap').toFileName()
        this.emergeMap = cfgValue.getValue('EmergeMap').toFileName()
        this.erodeMap = cfgValue.getValue('ErodeMap').toFileName()
        this.fallinMap = cfgValue.getValue('FallinMap').toFileName()
        this.blockPointersMap = cfgValue.getValue('BlockPointersMap').toFileName()
        this.cryOreMap = cfgValue.getValue('CryOreMap').toFileName()
        this.pathMap = cfgValue.getValue('PathMap').toFileName()
        this.noGather = cfgValue.getValue('NoGather').toBoolean()
        this.textureSet = cfgValue.getValue('TextureSet').toTextureSet()
        this.rockFallStyle = cfgValue.getValue('RockFallStyle').toString()
        this.emergeCreature = cfgValue.getValue('EmergeCreature').toString()
        this.safeCaverns = cfgValue.getValue('SafeCaverns').toBoolean()
        this.seeThroughWalls = cfgValue.getValue('SeeThroughWalls').toBoolean()
        this.oListFile = cfgValue.getValue('OListFile').toFileName()
        this.ptlFile = cfgValue.getValue('PtlFile').toFileName()
        this.nerpFile = cfgValue.getValue('NerpFile').toFileName()
        if (this.nerpFile?.toLowerCase().endsWith('.npl')) {
            this.nerpFile = this.nerpFile.replace('.npl', '.nrn')
            if (VERBOSE) console.warn(`Binary NERP file (.npl) not supported, using NERP text script (.nrn) instead from "${this.nerpFile}"`)
        }
        this.nerpMessageFile = cfgValue.getValue('NerpMessageFile').toFileName()
        this.objectiveText = cfgValue.getValue('ObjectiveText').toFileName()
        const valObjectiveImage = cfgValue.getValue('ObjectiveImage640x480')
        if (valObjectiveImage) this.objectiveImage640x480 = new ObjectiveImageCfg().setFromValue(valObjectiveImage)
        this.erodeTriggerTime = cfgValue.getValue('ErodeTriggerTime').toNumber()
        this.erodeErodeTime = cfgValue.getValue('ErodeErodeTime').toNumber()
        this.erodeLockTime = cfgValue.getValue('ErodeLockTime').toNumber()
        this.nextLevel = cfgValue.getValue('NextLevel').toLevelReference()
        this.levelLinks = cfgValue.getValue('LevelLinks').toArray(',', undefined).map((v) => v.toLevelReference())
        this.frontEndX = cfgValue.getValue('FrontEndX').toNumber()
        this.frontEndY = cfgValue.getValue('FrontEndY').toNumber()
        this.frontEndOpen = cfgValue.getValue('FrontEndOpen').toBoolean()
        cfgValue.getRecord('Priorities').forEachCfgEntryValue((value, name) => {
            const prio = new LevelPrioritiesEntryConfig(name, value.toBoolean())
            if ([ // XXX Prio list should be open for mods, BUT original specifies AI_Priority_Train, but does not show it in-game
                PriorityIdentifier.GET_IN,
                PriorityIdentifier.CRYSTAL,
                PriorityIdentifier.ORE,
                PriorityIdentifier.REPAIR,
                PriorityIdentifier.CLEARING,
                PriorityIdentifier.DESTRUCTION,
                PriorityIdentifier.CONSTRUCTION,
                PriorityIdentifier.REINFORCE,
                PriorityIdentifier.RECHARGE,
            ].includes(prio.key)) this.priorities.push(prio)
        })
        const valReward = cfgValue.getRecordOptional('Reward')
        if (valReward) this.reward = new LevelRewardConfig().setFromRecord(valReward)
        this.menuBMP = cfgValue.getValue('MenuBMP').toArray(',', 3).map((v) => v.toFileName())
        return this
    }

    isLocked(): boolean {
        return !SaveGameManager.preferences.testLevels &&
            !this.frontEndOpen &&
            !this.levelName.equalsIgnoreCase(GameConfig.instance.main.startLevel) &&
            !this.levelName.equalsIgnoreCase(GameConfig.instance.main.tutorialStartLevel) &&
            !SaveGameManager.getLevelCompleted(this.levelName) &&
            !this.isUnlockedByLevelLink()
    }

    private isUnlockedByLevelLink(): boolean {
        return GameConfig.instance.levels.some((levelEntryCfg) =>
            SaveGameManager.getLevelCompleted(levelEntryCfg.levelName) && levelEntryCfg.levelLinks.some((levelLink) => this.levelName.equalsIgnoreCase(levelLink))
        )
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
        } else if (name.equalsIgnoreCase('AI_Priority_GetTool')) {
            return PriorityIdentifier.GET_TOOL
        } else if (name.equalsIgnoreCase('AI_Priority_BuildPath')) {
            return PriorityIdentifier.BUILD_PATH
        } else {
            console.warn(`Unexpected priority identifier ${name}`)
            return PriorityIdentifier.NONE
        }
    }
}

export class LevelRewardConfig implements ConfigSetFromRecord {
    enable: boolean = true
    modifier: number = 0
    importance: LevelRewardImportanceConfig | undefined
    quota: LevelRewardQuotaConfig | undefined

    setFromRecord(cfgValue: CfgEntry): this {
        this.enable = cfgValue.getValue('Enable').toBoolean()
        this.modifier = cfgValue.getValue('Modifier').toNumber()
        this.importance = new LevelRewardImportanceConfig().setFromRecord(cfgValue.getRecord('Importance'))
        this.quota = new LevelRewardQuotaConfig().setFromRecord(cfgValue.getRecord('Quota'))
        return this
    }
}

export class LevelRewardImportanceConfig implements ConfigSetFromRecord {
    crystals: number = 0
    timer: number = 0
    caverns: number = 0
    constructions: number = 0
    oxygen: number = 0
    figures: number = 0

    setFromRecord(cfgValue: CfgEntry): this {
        this.crystals = cfgValue.getValue('crystals').toNumber()
        this.timer = cfgValue.getValue('timer').toNumber()
        this.caverns = cfgValue.getValue('caverns').toNumber()
        this.constructions = cfgValue.getValue('constructions').toNumber()
        this.oxygen = cfgValue.getValue('oxygen').toNumber()
        this.figures = cfgValue.getValue('figures').toNumber()
        return this
    }
}

export class LevelRewardQuotaConfig implements ConfigSetFromRecord {
    crystals: number = 0
    timerMs: number = 0
    caverns: number = 0
    constructions: number = 0

    setFromRecord(cfgValue: CfgEntry): this {
        this.crystals = cfgValue.getValue('crystals').toNumber()
        this.timerMs = cfgValue.getValue('timer').toNumber() * 1000
        this.caverns = cfgValue.getValue('caverns').toNumber()
        this.constructions = cfgValue.getValue('constructions').toNumber()
        return this
    }
}

export class ObjectiveImageCfg implements ConfigSetFromEntryValue {
    filename: string = ''
    x: number = 0
    y: number = 0

    setFromValue(cfgValue: CfgEntryValue): this {
        const array = cfgValue.toArray(',', 3)
        this.filename = array[0].toFileName()
        this.x = array[1].toNumber()
        this.y = array[2].toNumber()
        return this
    }
}
