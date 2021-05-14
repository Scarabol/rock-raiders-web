import { Vector2 } from 'three'
import { LevelEntryCfg } from '../cfg/LevelsCfg'
import { NerpParser } from '../core/NerpParser'
import { NerpRunner } from '../core/NerpRunner'
import { EventBus } from '../event/EventBus'
import { EventKey } from '../event/EventKeyEnum'
import { AirLevelChanged, SelectionChanged, SetupPriorityList } from '../event/LocalEvents'
import { JobCreateEvent } from '../event/WorldEvents'
import { UPDATE_OXYGEN_TIMER } from '../params'
import { ResourceManager } from '../resource/ResourceManager'
import { MaterialEntity } from './model/collect/MaterialEntity'
import { GameState } from './model/GameState'
import { PriorityList } from './model/job/PriorityList'
import { SelectionType } from './model/Selectable'

export class WorldManager {

    nerpRunner: NerpRunner = null
    oxygenUpdateInterval = null
    priorityList: PriorityList = new PriorityList()

    constructor() {
        EventBus.registerEventListener(EventKey.SELECTION_CHANGED, (event: SelectionChanged) => {
            if (event.selectionType === SelectionType.NOTHING) GameState.selectEntities([])
        })
        EventBus.registerEventListener(EventKey.CAVERN_DISCOVERED, () => {
            GameState.discoveredCaverns++
        })
        this.oxygenUpdateInterval = setInterval(this.updateOxygen.bind(this), UPDATE_OXYGEN_TIMER)
    }

    setup(levelConf: LevelEntryCfg, onLevelEnd: () => any) {
        GameState.totalCaverns = levelConf.reward?.quota?.caverns || 0
        this.priorityList.setList(levelConf.priorities)
        EventBus.publishEvent(new SetupPriorityList(this.priorityList.levelDefault))
        GameState.oxygenRate = levelConf.oxygenRate

        // load nerp script
        this.nerpRunner = NerpParser.parse(ResourceManager.getResource(levelConf.nerpFile))
        this.nerpRunner.messages.push(...(ResourceManager.getResource(levelConf.nerpMessageFile)))
        this.nerpRunner.onLevelEnd = onLevelEnd
    }

    start() {
        this.nerpRunner?.startExecution()
        GameState.levelStartTime = Date.now()
    }

    stop() {
        GameState.levelStopTime = Date.now()
        this.nerpRunner?.pauseExecution()
        GameState.buildings.forEach((b) => b.removeFromScene())
        GameState.buildingsUndiscovered.forEach((b) => b.removeFromScene())
        GameState.raiders.forEach((r) => r.removeFromScene())
        GameState.raidersUndiscovered.forEach((r) => r.removeFromScene())
        GameState.materials.forEach((m) => m.removeFromScene())
        GameState.materialsUndiscovered.forEach((m) => m.removeFromScene())
        GameState.spiders.forEach((m) => m.removeFromScene())
        GameState.bats.forEach((b) => b.removeFromScene())
    }

    placeMaterial(item: MaterialEntity, worldPosition: Vector2) {
        item.addToScene(worldPosition, 0)
        if (item.group.visible) {
            GameState.materials.push(item)
            EventBus.publishEvent(new JobCreateEvent(item.createCarryJob()))
        } else {
            GameState.materialsUndiscovered.push(item)
        }
        return item
    }

    updateOxygen() {
        const sum = GameState.raiders.map((r) => r.stats.OxygenCoef).reduce((l, r) => l + r, 0) +
            GameState.buildings.map((b) => b.isUsable() ? b.stats.OxygenCoef : 0).reduce((l, r) => l + r, 0)
        const rateMultiplier = 0.001
        const valuePerSecond = 1 / 25
        const msToSeconds = 0.001
        const diff = sum * GameState.oxygenRate * rateMultiplier * valuePerSecond * UPDATE_OXYGEN_TIMER * msToSeconds / 10
        const airLevel = Math.min(1, Math.max(0, GameState.airLevel + diff))
        if (GameState.airLevel !== airLevel) {
            GameState.airLevel = airLevel
            EventBus.publishEvent(new AirLevelChanged(GameState.airLevel))
        }
    }

}
