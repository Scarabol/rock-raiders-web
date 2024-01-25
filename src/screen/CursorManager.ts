import { Cursor } from '../resource/Cursor'
import { AnimatedCursor } from './AnimatedCursor'
import { clearTimeoutSafe } from '../core/Util'

export class CursorManager {
    static readonly cursorToUrl: Map<Cursor, AnimatedCursor> = new Map()

    currentCursor: Cursor = null
    cursorTimeout: NodeJS.Timeout = null
    activeCursor: AnimatedCursor = null

    constructor(readonly cursorTarget: HTMLElement) {
    }

    changeCursor(cursor: Cursor, timeout: number = null) {
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

    private setCursor(cursor: Cursor) {
        this.activeCursor?.disableAnimation()
        this.activeCursor = CursorManager.cursorToUrl.get(cursor)
        if (!this.activeCursor) throw new Error(`Cursor ${cursor} not found`)
        this.activeCursor.enableAnimation(this.cursorTarget)
    }
}
