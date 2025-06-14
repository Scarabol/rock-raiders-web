import { LevelRewardConfig } from '../../cfg/LevelsCfg'
import { ADDITIONAL_RAIDER_PER_SUPPORT } from '../../params'
import { GameState } from './GameState'
import { GameConfig } from '../../cfg/GameConfig'
import { PRNG } from '../factory/PRNG'

export enum GameResultState {
    // noinspection JSUnusedGlobalSymbols
    UNDECIDED = 0, // useful for truthiness checks
    QUIT,
    COMPLETE,
    FAILED,
    CRYSTAL_FAILURE,
}

export class GameResult {
    defencePercent: number = 100 // TODO defence report is either 0% or 100%
    airLevelPercent: number = 100
    numCrystal: number = 0
    numOre: number = 0
    numTotalOres: number = 0
    remainingDiggables: number = 0
    totalDiggables: number = 0
    discoveredCaverns: number = 0
    score: number = 100
    // fields below are only used to debug score calculations
    scoreCrystals: number = 0
    scoreTimer: number = 0
    scoreCaverns: number = 0
    scoreConstructions: number = 0
    scoreOxygen: number = 0
    scoreFigures: number = 0

    constructor(
        readonly levelFullName: string,
        readonly rewardConfig: LevelRewardConfig | undefined,
        readonly state: GameResultState,
        readonly numBuildings: number,
        readonly numRaiders: number,
        readonly numMaxAirRaiders: number,
        readonly gameTimeMs: number,
        readonly screenshot: HTMLCanvasElement | undefined,
    ) {
        this.airLevelPercent = GameState.airLevel * 100
        this.numCrystal = GameState.numCrystal
        this.numOre = GameState.numOre
        this.numTotalOres = GameState.numTotalOres
        this.remainingDiggables = GameState.remainingDiggables
        this.totalDiggables = GameState.totalDiggables
        this.discoveredCaverns = GameState.discoveredCaverns
        const quota = this.rewardConfig?.quota
        const importance = this.rewardConfig?.importance
        if (quota && importance) {
            this.scoreCrystals = quota.crystals ? Math.min(1, GameState.numCrystal / quota.crystals) * importance.crystals : 0
            this.scoreTimer = quota.timerMs && this.gameTimeMs <= quota.timerMs ? importance.timer : 0
            this.scoreCaverns = quota.caverns ? Math.min(1, GameState.discoveredCaverns / quota.caverns) * importance.caverns : 0
            this.scoreConstructions = quota.constructions ? Math.min(1, this.numBuildings / quota.constructions) * importance.constructions : 0
            this.scoreOxygen = GameState.airLevel * importance.oxygen
            this.scoreFigures = this.numRaiders / ADDITIONAL_RAIDER_PER_SUPPORT * importance.figures
            this.score = Math.max(0, Math.min(100, Math.round(this.scoreCrystals + this.scoreTimer + this.scoreCaverns + this.scoreConstructions + this.scoreOxygen + this.scoreFigures)))
        } else if (this.state === GameResultState.COMPLETE) {
            this.score = 100 // Tutorial levels get score 100 by default
        }
    }

    static random(): GameResult {
        const randomLevelConf = PRNG.unsafe.sample(GameConfig.instance.levels.filter((c) => c.levelName.toLowerCase().startsWith('level')))
        if (!randomLevelConf) throw new Error('Could not find random level configuration')
        return new GameResult(randomLevelConf.fullName, randomLevelConf.reward, GameResultState.COMPLETE, PRNG.unsafe.randInt(6), PRNG.unsafe.randInt(10), 10, 49062000, undefined)
    }
}
