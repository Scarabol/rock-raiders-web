import { EventBus } from '../../event/EventBus'
import { AirLevelChanged, NeededCrystalsChanged } from '../../event/LocalEvents'
import { MaterialAmountChanged, UsedCrystalsChanged } from '../../event/WorldEvents'
import { GameResultState } from './GameResult'
import { MaterialEntity } from './material/MaterialEntity'
import { EntityType } from './EntityType'

export class GameState {
    static gameResult: GameResultState = GameResultState.UNDECIDED
    static numCrystal: number = 0
    static numOre: number = 0
    static numBrick: number = 0
    static usedCrystals: number = 0
    static neededCrystals: number = 0
    static airLevel: number = 1 // air level in percent from 0 to 1.0
    static totalCrystals: number = 0
    static totalOres: number = 0
    static totalDiggables: number = 0
    static remainingDiggables: number = 0
    static totalCaverns: number = 0
    static discoveredCaverns: number = 0
    static hiddenObjectsFound: number = 0
    static alarmMode: boolean = false
    static objectiveShowing: number = 1

    static reset() {
        this.gameResult = GameResultState.UNDECIDED
        this.numCrystal = 0
        this.numOre = 0
        this.numBrick = 0
        this.usedCrystals = 0
        this.neededCrystals = 0
        this.airLevel = 1
        this.totalCrystals = 0
        this.totalOres = 0
        this.totalDiggables = 0
        this.remainingDiggables = 0
        this.totalCaverns = 0
        this.discoveredCaverns = 0
        this.hiddenObjectsFound = 0
        this.alarmMode = false
        this.objectiveShowing = 1
    }

    static changeUsedCrystals(changedCrystals: number) {
        if (!changedCrystals) return
        this.usedCrystals += changedCrystals
        EventBus.publishEvent(new UsedCrystalsChanged())
    }

    static changeAirLevel(diff: number) {
        const airLevel = Math.min(1, Math.max(0, this.airLevel + diff))
        if (this.airLevel !== airLevel) {
            this.airLevel = airLevel
            EventBus.publishEvent(new AirLevelChanged(this.airLevel))
        }
    }

    static changeNeededCrystals(crystals: number) {
        this.neededCrystals = crystals
        EventBus.publishEvent(new NeededCrystalsChanged())
    }

    static depositItem(item: MaterialEntity) {
        if (item.entityType === EntityType.ORE || item.entityType === EntityType.CRYSTAL || item.entityType === EntityType.BRICK) {
            if (item.entityType === EntityType.ORE) GameState.numOre++
            else if (item.entityType === EntityType.CRYSTAL) GameState.numCrystal++
            else if (item.entityType === EntityType.BRICK) GameState.numBrick++
            EventBus.publishEvent(new MaterialAmountChanged())
        }
    }
}
