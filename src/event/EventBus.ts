import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

class GenericEventBus<T extends GameEvent> {
    eventListener = new Map<EventKey, ((event: T) => any)[]>()
    workerListener: ((event: T) => any)[] = []
    blockedEvents: EventKey[] = []

    publishEvent(event: T) {
        if (this.blockedEvents.includes(event.eventKey)) return // event is currently blocked from publishing
        if (event.logEvent) console.log(`Event published: ${EventKey[event.eventKey]}`)
        this.blockedEvents.push(event.eventKey)
        this.workerListener.forEach((callback) => callback(event))
        this.getListener(event.eventKey).forEach((callback) => callback(event))
        this.blockedEvents.remove(event.eventKey)
    }

    registerEventListener(eventKey: EventKey, callback: (event: T) => any) {
        this.getListener(eventKey).push(callback)
    }

    private getListener(eventKey: EventKey) {
        return this.eventListener.getOrUpdate(eventKey, () => [])
    }

    registerWorkerListener(callback: (event: T) => any) {
        this.workerListener.push(callback)
    }
}

export const EventBus = new GenericEventBus()
