import { KeyEventType } from './EventTypeEnum'

export class GameKeyboardEvent {
    eventEnum: KeyEventType
    type: string
    bubbles: boolean
    key: string
    code: string

    constructor(eventEnum: KeyEventType, event: KeyboardEvent) {
        this.eventEnum = eventEnum
        this.type = event.type
        this.bubbles = false // disable bubbling otherwise we'll trigger this same event handler again
        this.key = event.key
        this.code = event.code
    }
}
