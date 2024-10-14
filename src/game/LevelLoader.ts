import { LevelPrioritiesEntryConfig, LevelRewardConfig, ObjectiveImageCfg } from '../cfg/LevelsCfg'
import { GameConfig } from '../cfg/GameConfig'
import { ResourceManager } from '../resource/ResourceManager'
import { NerpParser } from '../nerp/NerpParser'
import { NerpScript } from '../nerp/NerpScript'
import { LevelObjectiveTextEntry } from '../resource/fileparser/ObjectiveTextParser'
import { ObjectListEntryCfg } from '../cfg/ObjectListEntryCfg'
import { DEV_MODE } from '../params'
import { getMonsterEntityTypeByName, MonsterEntityType } from './model/EntityType'
import { NerpMessage } from '../resource/fileparser/NerpMsgParser'
import { RockFallStyle } from '../cfg/RockFallStyle'

export interface LevelConfData {
    levelName: string
    fullName: string
    generateSpiders: boolean
    textureBasename: string
    rockFallStyle: RockFallStyle
    fallinMultiplier: number
    mapWidth: number
    mapHeight: number
    terrainMap: number[][]
    pathMap?: number[][]
    surfaceMap?: number[][]
    predugMap: number[][]
    cryOreMap?: number[][]
    fallinMap?: number[][]
    erodeMap?: number[][]
    blockPointersMap?: number[][]
    emergeMap?: number[][]
    nerpScript: NerpScript
    nerpMessages: NerpMessage[]
    objectiveTextCfg: LevelObjectiveTextEntry
    objectiveImage640x480: ObjectiveImageCfg
    priorities: LevelPrioritiesEntryConfig[]
    disableStartTeleport: boolean
    disableEndTeleport: boolean
    objectList: Map<string, ObjectListEntryCfg>
    reward?: LevelRewardConfig
    oxygenRate: number
    erodeTriggerTimeMs: number
    erodeErodeTimeMs: number
    erodeLockTimeMs: number
    emergeCreature: MonsterEntityType
    emergeTimeOutMs: number
    noMultiSelect: boolean
}

export class LevelLoader {
    static fromName(levelName: string): LevelConfData {
        const levelConf = GameConfig.instance.levels.levelCfgByName.get(levelName)
        if (!levelConf) throw new Error(`Could not find level configuration for "${levelName}"`)
        const levelObjective = ResourceManager.getResource(levelConf.objectiveText) as Record<string, LevelObjectiveTextEntry>
        levelConf.objectiveTextCfg = levelObjective[levelName.toLowerCase()]
        const terrainMap = ResourceManager.getResource(levelConf.terrainMap)
        if (!terrainMap) throw new Error(`Could not load terrain data for "${levelConf.terrainMap}"`)
        const rockFallStyle = GameConfig.instance.rockFallStyles.get(levelConf.rockFallStyle.toLowerCase())
        if (!rockFallStyle) throw new Error(`Could not get rock fall style "${levelConf.rockFallStyle.toLowerCase()}" from config with ${Array.from(GameConfig.instance.rockFallStyles.values())}`)
        return {
            levelName: levelConf.levelName,
            fullName: levelConf.fullName,
            generateSpiders: levelConf.generateSpiders,
            mapWidth: terrainMap.width,
            mapHeight: terrainMap.height,
            textureBasename: GameConfig.instance.textures.textureSetByName.get(levelConf.textureSet).textureBasename,
            rockFallStyle: rockFallStyle,
            fallinMultiplier: levelConf.fallinMultiplier,
            terrainMap: this.checkMap(levelConf.terrainMap, terrainMap.width, terrainMap.height),
            pathMap: this.checkMap(levelConf.pathMap, terrainMap.width, terrainMap.height),
            surfaceMap: this.checkMap(levelConf.surfaceMap, terrainMap.width, terrainMap.height),
            predugMap: this.checkMap(levelConf.predugMap, terrainMap.width, terrainMap.height),
            cryOreMap: this.checkMap(levelConf.cryOreMap, terrainMap.width, terrainMap.height),
            fallinMap: this.checkMap(levelConf.fallinMap, terrainMap.width, terrainMap.height),
            erodeMap: this.checkMap(levelConf.erodeMap, terrainMap.width, terrainMap.height),
            blockPointersMap: this.checkMap(levelConf.blockPointersMap, terrainMap.width, terrainMap.height),
            emergeMap: this.checkMap(levelConf.emergeMap, terrainMap.width, terrainMap.height),
            nerpScript: NerpParser.parse(levelConf.nerpFile),
            nerpMessages: ResourceManager.getResource(levelConf.nerpMessageFile) ?? [],
            objectiveTextCfg: levelConf.objectiveTextCfg,
            objectiveImage640x480: levelConf.objectiveImage640x480,
            priorities: levelConf.priorities,
            disableStartTeleport: levelConf.disableStartTeleport || DEV_MODE,
            disableEndTeleport: levelConf.disableEndTeleport || DEV_MODE,
            objectList: ResourceManager.getResource(levelConf.oListFile),
            reward: levelConf.reward,
            oxygenRate: levelConf.oxygenRate,
            erodeTriggerTimeMs: levelConf.erodeTriggerTime * 1000,
            erodeErodeTimeMs: levelConf.erodeErodeTime * 1000,
            erodeLockTimeMs: levelConf.erodeLockTime * 1000,
            emergeCreature: getMonsterEntityTypeByName(levelConf.emergeCreature),
            emergeTimeOutMs: levelConf.emergeTimeOut / 1500 * 60 * 1000, // 1500 specifies 1 minute
            noMultiSelect: levelConf.noMultiSelect,
        }
    }

    static checkMap(mapFileName: string, width: number, height: number): number[][] | undefined {
        const map = ResourceManager.getResource(mapFileName)
        if (!map) return undefined
        if (map.width !== width || map.height !== height) {
            console.warn(`Given map "${mapFileName}" has unexpected size ${width} x ${height}`)
            return undefined
        }
        return map.level
    }
}
