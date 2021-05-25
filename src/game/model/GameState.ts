export class GameState {

    static numCrystal: number = 0
    static numOre: number = 0
    static numBrick: number = 0
    static usedCrystals: number = 0
    static neededCrystals: number = 0
    static airLevel: number = 1 // air level in percent from 0 to 1.0
    static requestedRaiders: number = 0
    static totalCrystals: number = 0
    static totalOres: number = 0
    static totalDiggables: number = 0
    static remainingDiggables: number = 0
    static totalCaverns: number = 0
    static discoveredCaverns: number = 0
    static levelStartTime: number = 0
    static levelStopTime: number = 0

    static reset() {
        this.numCrystal = 0
        this.numOre = 0
        this.numBrick = 0
        this.usedCrystals = 0
        this.neededCrystals = 0
        this.airLevel = 1
        this.requestedRaiders = 0
        this.totalCrystals = 0
        this.totalOres = 0
        this.totalDiggables = 0
        this.remainingDiggables = 0
        this.totalCaverns = 0
        this.discoveredCaverns = 0
        this.levelStartTime = 0
        this.levelStopTime = 0
    }

    static get gameTimeSeconds() {
        return Math.round((GameState.levelStopTime - GameState.levelStartTime) / 1000)
    }

}
