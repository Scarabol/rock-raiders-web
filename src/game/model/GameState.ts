export class GameState {

    static numOre: number = 0;
    static numCrystal: number = 0;
    static usedCrystals: number = 0;
    static neededCrystals: number = 0;
    static airlevel: number = 1; // airlevel in percent from 0 to 1.0

    static reset() {
        this.numOre = 0;
        this.numCrystal = 0;
        this.usedCrystals = 0;
        this.neededCrystals = 0;
        this.airlevel = 1;
    }

}
