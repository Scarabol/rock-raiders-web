import { iGet } from '../../core/Util'
import { EventKey } from '../../event/EventKeyEnum'
import { IEventHandler } from '../../event/IEventHandler'
import { ChangeCursor } from '../../event/LocalEvents'
import { ResourceManager } from '../../resource/ResourceManager'
import { Cursors } from '../Cursors'
import { ScreenLayer } from './ScreenLayer'

export class CursorLayer extends ScreenLayer {

    pointersCfg
    curUrl

    constructor(parent: IEventHandler) {
        super(true, false)
        parent.registerEventListener(EventKey.CHANGE_CURSOR, (event: ChangeCursor) => {
            this.changeCursor(event.cursor)
        })
    }

    show() {
        super.show()
        this.pointersCfg = ResourceManager.cfg('Pointers')
        this.changeCursor(Cursors.Pointer_Standard)
    }

    hide() {
        super.hide()
        this.canvas.style.cursor = null
    }

    private changeCursor(cursor: Cursors) {
        if (this.curUrl) URL.revokeObjectURL(this.curUrl)
        if (!this.pointersCfg) return
        const cursorFilename = iGet(this.pointersCfg, Cursors[cursor])
        const curImg = ResourceManager.getImage(cursorFilename)
        this.curUrl = curImg.toDataURL()
        // no resized possible; Chrome limits cursor size to 32x32 anyway
        this.canvas.style.cursor = 'url(' + this.curUrl + '), auto'
    }

}
