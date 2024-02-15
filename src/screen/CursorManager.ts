import { Cursor } from '../resource/Cursor'
import { AnimatedCursor } from './AnimatedCursor'
import { clearTimeoutSafe } from '../core/Util'
import { EventBroker } from '../event/EventBroker'
import { EventKey } from '../event/EventKeyEnum'
import { ChangeCursor } from '../event/GuiCommand'

export class CursorManager {
    static readonly cursorToUrl: Map<Cursor, AnimatedCursor> = new Map()

    static cursorTarget: HTMLElement
    static currentCursor: Cursor = null
    static cursorTimeout: NodeJS.Timeout = null
    static activeCursor: AnimatedCursor = null

    static init() {
        this.cursorTarget = document.getElementById('game-canvas-container')
        EventBroker.subscribe(EventKey.COMMAND_CHANGE_CURSOR, (event: ChangeCursor) => {
            this.changeCursor(event.cursor, event.timeout)
        })
    }

    static addCursor(cursor: Cursor, dataUrls: string[]) {
        this.cursorToUrl.set(cursor, new AnimatedCursor(dataUrls))
    }

    private static changeCursor(cursor: Cursor, timeout: number = null) {
        if (timeout) {
            this.cursorTimeout = clearTimeoutSafe(this.cursorTimeout)
            this.setCursor(cursor)
            this.cursorTimeout = setTimeout(() => {
                this.cursorTimeout = null
                this.setCursor(this.currentCursor)
            }, timeout)
        } else if (this.currentCursor !== cursor) {
            this.currentCursor = cursor
            if (this.cursorTimeout) return
            this.setCursor(cursor)
        }
    }

    private static setCursor(cursor: Cursor) {
        this.activeCursor?.disableAnimation()
        this.activeCursor = CursorManager.cursorToUrl.get(cursor)
        if (!this.activeCursor) throw new Error(`Cursor ${cursor} not found`)
        this.activeCursor.enableAnimation(this.cursorTarget)
    }
}
