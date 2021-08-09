import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

export interface IEventHandler {
    publishEvent(event: GameEvent): void

    registerEventListener(eventKey: EventKey, callback: (event: GameEvent) => any): void
}
