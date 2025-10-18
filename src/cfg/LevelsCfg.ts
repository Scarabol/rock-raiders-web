import { PRIORITY_IDENTIFIER, PriorityIdentifier } from '../game/model/job/PriorityIdentifier'
import { GameConfig } from './GameConfig'
import { SaveGameManager } from '../resource/SaveGameManager'
import { DEV_MODE, VERBOSE } from '../params'
import { ConfigSetFromEntryValue, ConfigSetFromRecord } from './Configurable'
import { CfgEntry, CfgEntryValue } from './CfgEntry'
import { EntityType, getMonsterEntityTypeByName, MonsterEntityType } from '../game/model/EntityType'

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
    emergeTimeOutMs: number = 0
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
    fpRotLight: [r: number, g: number, b: number] = [0, 0, 0]
    fogColour: [r: number, g: number, b: number] = [0, 0, 0]
    highFogColour: [r: number, g: number, b: number] = [0, 0, 0]
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
    emergeCreature: MonsterEntityType = EntityType.NONE
    safeCaverns: boolean = true
    seeThroughWalls: boolean = false
    oListFile: string = ''
    ptlFile: string = ''
    nerpFile: string = ''
    nerpMessageFile: string = ''
    objectiveText: string = ''
    objectiveImage: ObjectiveImageCfg = new ObjectiveImageCfg()
    erodeTriggerTimeMs: number = 0 // 1, 20, 40, 60, 120 time in seconds to trigger a new erosion
    erodeErodeTimeMs: number = 0 // 1, 5, 7, 20, 30, 40, 60 time in seconds until next erosion level is reached
    erodeLockTimeMs: number = 0 // 1, 300, 500, 600 grace time no erosion happens on surface with power path
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
        this.disableEndTeleport = cfgValue.getValue('DisableEndTeleport').toBoolean() || DEV_MODE
        this.disableStartTeleport = cfgValue.getValue('DisableStartTeleport').toBoolean() || DEV_MODE
        this.emergeTimeOutMs = cfgValue.getValue('EmergeTimeOut').toNumber() / 1500 * 60 * 1000 // 1500 specifies 1 minute
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
        this.fpRotLight = cfgValue.getValue('FpRotLightRGB').toRGB(this.fpRotLight)
        this.fogColour = cfgValue.getValue('FogColourRGB').toRGB()
        this.highFogColour = cfgValue.getValue('HighFogColourRGB').toRGB()
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
        this.emergeCreature = getMonsterEntityTypeByName(cfgValue.getValue('EmergeCreature').toString())
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
        this.objectiveImage.setFromValue(cfgValue.getValue('ObjectiveImage640x480'))
        this.erodeTriggerTimeMs = cfgValue.getValue('ErodeTriggerTime').toNumber() * 1000
        this.erodeErodeTimeMs = cfgValue.getValue('ErodeErodeTime').toNumber() * 1000
        this.erodeLockTimeMs = cfgValue.getValue('ErodeLockTime').toNumber() * 1000
        this.nextLevel = cfgValue.getValue('NextLevel').toLevelReference()
        this.levelLinks = cfgValue.getValue('LevelLinks').toArray(',', undefined).map((v) => v.toLevelReference())
        this.frontEndX = cfgValue.getValue('FrontEndX').toNumber()
        this.frontEndY = cfgValue.getValue('FrontEndY').toNumber()
        this.frontEndOpen = cfgValue.getValue('FrontEndOpen').toBoolean()
        cfgValue.getRecord('Priorities').forEachCfgEntryValue((value, name) => {
            const prio = new LevelPrioritiesEntryConfig(name, value.toBoolean())
            // XXX Priority list should be open for mods, BUT original specifies AI_Priority_Train and does not show it in-game
            const priorityWhitelist: PriorityIdentifier[] = [
                PRIORITY_IDENTIFIER.getIn,
                PRIORITY_IDENTIFIER.crystal,
                PRIORITY_IDENTIFIER.ore,
                PRIORITY_IDENTIFIER.repair,
                PRIORITY_IDENTIFIER.clearing,
                PRIORITY_IDENTIFIER.destruction,
                PRIORITY_IDENTIFIER.construction,
                PRIORITY_IDENTIFIER.reinforce,
                PRIORITY_IDENTIFIER.recharge,
            ]
            if (priorityWhitelist.includes(prio.key)) this.priorities.push(prio)
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

    public static isLevel(levelName: string | undefined): boolean {
        return !!levelName?.toLowerCase().startsWith('level')
    }

    public static isTutorial(levelName: string | undefined): boolean {
        return !!levelName?.toLowerCase().startsWith('tutorial')
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
            return PRIORITY_IDENTIFIER.train
        } else if (name.equalsIgnoreCase('AI_Priority_GetIn')) {
            return PRIORITY_IDENTIFIER.getIn
        } else if (name.equalsIgnoreCase('AI_Priority_Crystal')) {
            return PRIORITY_IDENTIFIER.crystal
        } else if (name.equalsIgnoreCase('AI_Priority_Ore')) {
            return PRIORITY_IDENTIFIER.ore
        } else if (name.equalsIgnoreCase('AI_Priority_Repair')) {
            return PRIORITY_IDENTIFIER.repair
        } else if (name.equalsIgnoreCase('AI_Priority_Clearing')) {
            return PRIORITY_IDENTIFIER.clearing
        } else if (name.equalsIgnoreCase('AI_Priority_Destruction')) {
            return PRIORITY_IDENTIFIER.destruction
        } else if (name.equalsIgnoreCase('AI_Priority_Construction')) {
            return PRIORITY_IDENTIFIER.construction
        } else if (name.equalsIgnoreCase('AI_Priority_Reinforce')) {
            return PRIORITY_IDENTIFIER.reinforce
        } else if (name.equalsIgnoreCase('AI_Priority_Recharge')) {
            return PRIORITY_IDENTIFIER.recharge
        } else if (name.equalsIgnoreCase('AI_Priority_GetTool')) {
            return PRIORITY_IDENTIFIER.getTool
        } else if (name.equalsIgnoreCase('AI_Priority_BuildPath')) {
            return PRIORITY_IDENTIFIER.buildPath
        } else {
            console.warn(`Unexpected priority identifier ${name}`)
            return PRIORITY_IDENTIFIER.none
        }
    }
}

export class LevelRewardConfig implements ConfigSetFromRecord {
    enable: boolean = true
    modifier: number = 0
    importance: LevelRewardImportanceConfig = new LevelRewardImportanceConfig()
    quota: LevelRewardQuotaConfig = new LevelRewardQuotaConfig()

    setFromRecord(cfgValue: CfgEntry): this {
        this.enable = cfgValue.getValue('Enable').toBoolean()
        this.modifier = cfgValue.getValue('Modifier').toNumber()
        this.importance.setFromRecord(cfgValue.getRecord('Importance'))
        this.quota.setFromRecord(cfgValue.getRecord('Quota'))
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
