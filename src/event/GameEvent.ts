import { EventKey } from './EventKeyEnum'

export class GameEvent {

    eventKey: EventKey
    isLocal: boolean

    constructor(eventKey: EventKey) {
        this.eventKey = eventKey
    }

}
