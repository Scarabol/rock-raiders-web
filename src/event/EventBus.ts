import { EventKey } from './EventKeyEnum'
import { GameEvent } from './GameEvent'

export class EventBus {
    static eventListener = new Map<EventKey, ((event: GameEvent) => any)[]>()
    static workerListener: ((event: GameEvent) => any)[] = []
    static blockedEvents: EventKey[] = []

    static publishEvent(event: GameEvent) {
        if (this.blockedEvents.includes(event.eventKey)) return // event is currently blocked from publishing
        if (!event.isLocal) console.log(`Event published: ${EventKey[event.eventKey]}`)
        this.blockedEvents.push(event.eventKey)
        this.workerListener.forEach((callback) => callback(event))
        this.getListener(event.eventKey).forEach((callback) => callback(event))
        this.blockedEvents.remove(event.eventKey)
    }

    static registerEventListener(eventKey: EventKey, callback: (event: GameEvent) => any) {
        this.getListener(eventKey).push(callback)
    }

    private static getListener(eventKey: EventKey) {
        return this.eventListener.getOrUpdate(eventKey, () => [])
    }

    static registerWorkerListener(callback: (event: GameEvent) => any) {
        this.workerListener.push(callback)
    }

    // TODO cleanup/unregister all event listener at level end?!
}
