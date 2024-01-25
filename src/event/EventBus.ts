import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

type GameEventListener = (event: GameEvent) => void

export class EventBus {
    static readonly eventListener: Map<EventKey, GameEventListener[]> = new Map<EventKey, GameEventListener[]>()
    static readonly blockedEvents: Set<EventKey> = new Set<EventKey>()

    static publishEvent(event: GameEvent) {
        if (this.blockedEvents.has(event.eventKey)) return // event is currently blocked from publishing
        if (event.logEvent) console.log(`Event published: ${EventKey[event.eventKey]}`)
        this.blockedEvents.add(event.eventKey)
        this.getListener(event.eventKey).forEach((callback: GameEventListener) => callback(event))
        this.blockedEvents.delete(event.eventKey)
    }

    static registerEventListener<T extends GameEvent>(eventKey: EventKey, callback: (event: T) => void) {
        this.getListener(eventKey).push(callback as GameEventListener)
    }

    private static getListener(eventKey: EventKey): GameEventListener[] {
        return this.eventListener.getOrUpdate(eventKey, () => [])
    }
}
