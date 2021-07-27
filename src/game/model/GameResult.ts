import { EntityManager } from '../EntityManager'
import { WorldManager } from '../WorldManager'

export enum GameResultState {

    UNDECIDED,
    QUIT,
    COMPLETE,
    FAILED,

}

export class GameResult {

    state: GameResultState
    numBuildings: number
    numRaiders: number
    numMaxRaiders: number
    gameTimeSeconds: number

    constructor(state: GameResultState, entityMgr: EntityManager, worldMgr: WorldManager) {
        this.state = state
        this.numBuildings = entityMgr.buildings.length
        this.numRaiders = entityMgr.raiders.length
        this.numMaxRaiders = entityMgr.getMaxRaiders()
        this.gameTimeSeconds = Math.round(worldMgr.elapsedGameTimeMs / 1000)
    }

}
