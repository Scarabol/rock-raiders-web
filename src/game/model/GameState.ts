import { EventBus } from '../../event/EventBus'
import { MaterialAmountChanged } from '../../event/WorldEvents'
import { MaterialEntity } from './material/MaterialEntity'
import { EntityType } from './EntityType'
import { DEV_MODE } from '../../params'
import { Surface } from '../terrain/Surface'

export class GameState {
    static numCrystal: number = 0
    static numOre: number = 0
    static numBrick: number = 0
    static usedCrystals: number = 0
    static airLevel: number = 1 // air level in percent from 0 to 1.0
    static totalCrystals: number = 0
    static numTotalOres: number = 0
    static totalDiggables: number = 0
    static remainingDiggables: number = 0
    static discoveredCaverns: number = 0
    static hiddenObjectsFound: number = 0
    static alarmMode: boolean = false
    static objectiveShowing: number = 1
    static showObjInfo: boolean = DEV_MODE
    static monsterCongregation: Surface = null

    static reset() {
        this.numCrystal = 0
        this.numOre = 0
        this.numBrick = 0
        this.usedCrystals = 0
        this.airLevel = 1
        this.totalCrystals = 0
        this.numTotalOres = 0
        this.totalDiggables = 0
        this.remainingDiggables = 0
        this.discoveredCaverns = 0
        this.hiddenObjectsFound = 0
        this.alarmMode = false
        this.objectiveShowing = 1
        this.monsterCongregation = null
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
