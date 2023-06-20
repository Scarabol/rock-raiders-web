import '../core'
import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

type GenericGameEventListener<T extends GameEvent> = (event: T) => any

class GenericEventBus<T extends GameEvent> {
    eventListener: Map<EventKey, GenericGameEventListener<T>[]> = new Map()
    blockedEvents: EventKey[] = []

    publishEvent(event: T) {
        if (this.blockedEvents.includes(event.eventKey)) return // event is currently blocked from publishing
        if (event.logEvent) console.log(`Event published: ${EventKey[event.eventKey]}`)
        this.blockedEvents.push(event.eventKey)
        this.getListener(event.eventKey).forEach((callback: GenericGameEventListener<T>) => callback(event))
        this.blockedEvents.remove(event.eventKey)
    }

    registerEventListener(eventKey: EventKey, callback: (event: T) => any) {
        this.getListener(eventKey).push(callback)
    }

    private getListener(eventKey: EventKey): GenericGameEventListener<T>[] {
        return this.eventListener.getOrUpdate(eventKey, () => [])
    }
}

export const EventBus: GenericEventBus<GameEvent> = new GenericEventBus<GameEvent>()
