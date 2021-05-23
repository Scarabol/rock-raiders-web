import { EntityManager } from '../EntityManager'

export enum GameResultState {

    QUIT,
    COMPLETE,
    FAILED,

}

export class GameResult {

    state: GameResultState
    numBuildings: number
    numRaiders: number
    numMaxRaiders: number

    constructor(state: GameResultState, entityMgr: EntityManager) {
        this.state = state
        this.numBuildings = entityMgr.buildings.length
        this.numRaiders = entityMgr.raiders.length
        this.numMaxRaiders = entityMgr.getMaxRaiders()
    }

}
