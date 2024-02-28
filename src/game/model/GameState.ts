import { Vector2 } from 'three'
import { PriorityList } from '../../gui/toppanel/PriorityList'
import { DEV_MODE } from '../../params'

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
    static showObjInfo: boolean = false
    static monsterCongregation: Vector2 = null
    static priorityList: PriorityList = new PriorityList()
    static tutoBlockClicks: Map<number, number> = new Map()

    static reset() {
        this.numCrystal = this.getDevParam('numCrystal', 0)
        this.numOre = this.getDevParam('numOre', 0)
        this.numBrick = this.getDevParam('numBrick', 0)
        this.usedCrystals = 0
        this.airLevel = 1
        this.totalCrystals = 0
        this.numTotalOres = 0
        this.totalDiggables = 0
        this.remainingDiggables = 0
        this.discoveredCaverns = 0
        this.hiddenObjectsFound = 0
        this.alarmMode = false
        this.monsterCongregation = null
        this.priorityList = new PriorityList()
        this.tutoBlockClicks = new Map()
    }

    static getDevParam(paramName: string, fallback: number): number {
        if (!DEV_MODE) return fallback
        const params = new URLSearchParams(window.location.search)
        return Number(params.get(paramName)) || fallback
    }
}
