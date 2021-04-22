import { GameEvent } from './GameEvent'
import { EventKey } from './EventKeyEnum'

export class EventBus {

    static eventListener = new Map<EventKey, ((event: GameEvent) => any)[]>()
    static blockedEvents = []

    static publishEvent(event: GameEvent) {
        if (this.blockedEvents.includes(event.eventKey)) return // event is currently blocked from publishing
        if (!event.isLocal) console.log('Event published: ' + EventKey[event.eventKey])
        this.blockedEvents.push(event.eventKey)
        this.getListener(event.eventKey).forEach((callback) => callback(event))
        this.blockedEvents.remove(event.eventKey)
    }

    static registerEventListener(eventKey: EventKey, callback: (GameEvent) => any) {
        this.getListener(eventKey).push(callback)
    }

    private static getListener(eventKey: EventKey) {
        return this.eventListener.getOrUpdate(eventKey, () => [])
    }

    // TODO cleanup/unregister all event listener at level end?!

}
