import { EventKey } from './EventKeyEnum'

export class GameEvent {
    logEvent: boolean = false
    guiForward: boolean = true

    constructor(readonly eventKey: EventKey) {
    }
}
