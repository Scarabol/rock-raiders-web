import { AbstractGameSystem, GameEntity } from '../ECS'
import { OxygenComponent } from '../component/OxygenComponent'
import { GameState } from '../model/GameState'
import { AirLevelChanged, GameResultEvent, LevelSelectedEvent } from '../../event/WorldEvents'
import { GameResultState } from '../model/GameResult'
import { EventKey } from '../../event/EventKeyEnum'
import { EventBroker } from '../../event/EventBroker'

export class OxygenSystem extends AbstractGameSystem {
    componentsRequired: Set<Function> = new Set([OxygenComponent])
    levelOxygenRate: number = 0

    constructor() {
        super()
        EventBroker.subscribe(EventKey.LEVEL_SELECTED, (event: LevelSelectedEvent) => {
            this.levelOxygenRate = event.levelConf.oxygenRate / 1000 / 100 / 1000
        })
    }

    update(entities: Set<GameEntity>, dirty: Set<GameEntity>, elapsedMs: number): void {
        let coefSum = 0
        for (const entity of entities) {
            try {
                const components = this.ecs.getComponents(entity)
                const oxygenComponent = components.get(OxygenComponent)
                coefSum += oxygenComponent.oxygenCoefficient
            } catch (e) {
                console.error(e)
            }
        }
        const airDiff = coefSum * this.levelOxygenRate * elapsedMs
        const nextAirLevel = Math.max(0, Math.min(1, GameState.airLevel + airDiff))
        if (GameState.airLevel !== nextAirLevel) {
            GameState.airLevel = nextAirLevel
            EventBroker.publish(new AirLevelChanged(GameState.airLevel))
            if (GameState.airLevel <= 0) EventBroker.publish(new GameResultEvent(GameResultState.FAILED)) // Level 22 has oxygen, but no NERP check
        }
    }
}
