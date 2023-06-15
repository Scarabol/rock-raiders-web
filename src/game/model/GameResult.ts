import { LevelEntryCfg, LevelRewardConfig } from '../../cfg/LevelsCfg'
import { ADDITIONAL_RAIDER_PER_SUPPORT } from '../../params'
import { GameState } from './GameState'
import { ResourceManager } from '../../resource/ResourceManager'

export enum GameResultState {
    UNDECIDED,
    QUIT,
    COMPLETE,
    FAILED,
}

export class GameResult {
    levelFullName: string
    defencePercent: number
    airLevelPercent: number
    score: number
    // fields below are only used to debug score calculations
    rewardConfig: LevelRewardConfig = null
    scoreCrystals: number = 0
    scoreTimer: number = 0
    scoreCaverns: number = 0
    scoreConstructions: number = 0
    scoreOxygen: number = 0
    scoreFigures: number = 0

    constructor(
        levelConf: LevelEntryCfg,
        readonly state: GameResultState,
        readonly numBuildings: number,
        readonly numRaiders: number,
        readonly numMaxRaiders: number,
        readonly gameTimeSeconds: number,
        readonly screenshot: HTMLCanvasElement
    ) {
        this.levelFullName = levelConf.fullName
        this.defencePercent = 100 // TODO defence report is either 0% or 100%
        this.airLevelPercent = GameState.airLevel * 100
        this.rewardConfig = levelConf?.reward
        if (this.rewardConfig) {
            const quota = this.rewardConfig.quota
            const importance = this.rewardConfig.importance
            this.scoreCrystals = GameState.numCrystal >= (quota.crystals || Infinity) ? importance.crystals : 0
            this.scoreTimer = this.gameTimeSeconds <= (quota.timer || 0) ? importance.timer : 0
            this.scoreCaverns = quota.caverns ? Math.min(1, GameState.discoveredCaverns / quota.caverns) * importance.caverns : 0
            this.scoreConstructions = quota.constructions ? Math.min(1, this.numBuildings / quota.constructions) * importance.constructions : 0
            this.scoreOxygen = GameState.airLevel * importance.oxygen
            this.scoreFigures = this.numRaiders >= ADDITIONAL_RAIDER_PER_SUPPORT ? importance.figures : 0
            this.score = Math.max(0, Math.min(100, Math.round(this.scoreCrystals + this.scoreTimer + this.scoreCaverns + this.scoreConstructions + this.scoreOxygen + this.scoreFigures)))
        }
    }

    static random(): GameResult {
        const randomLevelConf = Array.from(ResourceManager.configuration.levels.levelCfgByName.values()).random()
        return new GameResult(randomLevelConf, GameResultState.COMPLETE, Math.randomInclusive(6), Math.randomInclusive(10), 10, 942, null)
    }
}
