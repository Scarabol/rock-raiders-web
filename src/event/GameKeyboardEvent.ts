import { KEY_EVENT } from './EventTypeEnum'

export class GameKeyboardEvent {
    eventEnum: KEY_EVENT
    type: string
    bubbles: boolean
    key: string
    code: string

    constructor(eventEnum: KEY_EVENT, event: KeyboardEvent) {
        this.eventEnum = eventEnum
        this.type = event.type
        this.bubbles = false // disable bubbling otherwise we'll trigger this same event handler again
        this.key = event.key
        this.code = event.code
    }
}
