import { removeFromArray } from '../core/Util'

export class EventBus {

    static eventListener = new Map<string, ((event: GameEvent) => any)[]>()
    static blockedEvents = []

    static publishEvent(event: GameEvent) {
        if (this.blockedEvents.includes(event.eventKey)) return // event is currently blocked from publishing
        if (!event.isLocal) console.log('Event published: ' + event.eventKey)
        this.blockedEvents.push(event.eventKey)
        this.getListener(event.eventKey).forEach((callback) => callback(event)) // TODO add inheritance match by prefix
        removeFromArray(this.blockedEvents, event.eventKey)
    }

    static registerEventListener(eventKey: string, callback: (GameEvent) => any) {
        const listener = this.getListener(eventKey)
        listener.push(callback)
        this.eventListener.set(eventKey, listener)
    }

    private static getListener(eventKey: string) {
        return this.eventListener.get(eventKey) || []
    }
}

export class GameEvent {

    eventKey: string
    isLocal: boolean

    constructor(eventKey: string) {
        this.eventKey = eventKey
    }

}
