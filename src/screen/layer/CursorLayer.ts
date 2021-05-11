import { clearTimeoutSafe } from '../../core/Util'
import { EventKey } from '../../event/EventKeyEnum'
import { IEventHandler } from '../../event/IEventHandler'
import { ChangeCursor } from '../../event/LocalEvents'
import { ResourceManager } from '../../resource/ResourceManager'
import { Cursor } from '../Cursor'
import { ScreenLayer } from './ScreenLayer'

export class CursorLayer extends ScreenLayer {

    currentCursor: Cursor = null
    timedCursor: Cursor = null
    cursorTimeout = null

    constructor(parent: IEventHandler) {
        super(true, false)
        parent.registerEventListener(EventKey.CHANGE_CURSOR, (event: ChangeCursor) => {
            this.changeCursor(event.cursor, event.timeout)
        })
    }

    show() {
        super.show()
        this.changeCursor(Cursor.Pointer_Standard)
    }

    hide() {
        super.hide()
        this.canvas.style.cursor = null
    }

    private changeCursor(cursor: Cursor, timeout: number = null) {
        if (timeout) {
            this.cursorTimeout = clearTimeoutSafe(this.cursorTimeout)
            if (this.timedCursor !== cursor) this.setCursor(cursor)
            const that = this
            this.cursorTimeout = setTimeout(() => {
                that.cursorTimeout = null
                that.setCursor(that.currentCursor)
            }, timeout)
        } else if (this.currentCursor !== cursor) {
            this.currentCursor = cursor
            if (this.cursorTimeout) return
            this.setCursor(cursor)
        }
    }

    private setCursor(cursor: Cursor) {
        this.canvas.style.cursor = ResourceManager.getCursorUrl(cursor)
    }

}
