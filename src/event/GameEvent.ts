import { EventKey } from './EventKeyEnum'

export class GameEvent {
    logEvent: boolean = false

    constructor(readonly eventKey: EventKey) {
    }
}
