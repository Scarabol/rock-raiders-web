import { removeFromArray } from '../core/Util'

export class EventBus {

    static eventListener = {} // TODO use map
    static blockedEvents = []

    static publishEvent(event: GameEvent) {
        if (this.blockedEvents.includes(event.eventKey)) return // event is currently blocked from publishing
        if (!event.isLocal) console.log('Event published: ' + event.eventKey)
        this.blockedEvents.push(event.eventKey);
        (this.eventListener[event.eventKey] || []).forEach((callback) => callback(event)) // TODO add inheritance match by prefix
        removeFromArray(this.blockedEvents, event.eventKey)
    }

    static registerEventListener(eventKey: string, callback: (GameEvent) => any) {
        this.eventListener[eventKey] = this.eventListener[eventKey] || []
        this.eventListener[eventKey].push(callback)
    }

}

export class GameEvent {

    eventKey: string
    isLocal: boolean

    constructor(eventKey: string) {
        this.eventKey = eventKey
    }

}
