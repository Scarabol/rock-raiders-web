import { EventKey } from './EventKeyEnum'

export class GameEvent {
    eventKey: EventKey
    isLocal: boolean
    guiForward: boolean

    constructor(eventKey: EventKey) {
        this.eventKey = eventKey
        this.guiForward = true
    }
}
