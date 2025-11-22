import { Cursor } from '../cfg/PointersCfg'
import { AnimatedCursor } from './AnimatedCursor'
import { clearTimeoutSafe } from '../core/Util'
import { HTML_GAME_CANVAS_CONTAINER } from '../core'

export class CursorManager {
    static readonly cursorToUrl: Map<Cursor, AnimatedCursor> = new Map()
    static currentCursor: Cursor
    static cursorTimeout: NodeJS.Timeout | undefined
    static activeCursor: AnimatedCursor | undefined

    static addCursor(cursor: Cursor, dataUrls: string[]) {
        this.cursorToUrl.set(cursor, new AnimatedCursor(dataUrls))
    }

    static changeCursor(cursor: Cursor, timeout?: number) {
        if (timeout) {
            this.cursorTimeout = clearTimeoutSafe(this.cursorTimeout)
            this.setCursor(cursor)
            this.cursorTimeout = setTimeout(() => {
                this.cursorTimeout = undefined
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
        this.activeCursor.enableAnimation(HTML_GAME_CANVAS_CONTAINER)
    }
}
