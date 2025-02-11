import { Rect } from '../../core/Rect'
import { SelectionFrameChangeEvent } from '../../event/LocalEvents'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenLayer } from './ScreenLayer'
import { EventKey } from '../../event/EventKeyEnum'
import { EventBroker } from '../../event/EventBroker'
import { SaveGameManager } from '../../resource/SaveGameManager'

export class SelectionFrameLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrame
    selectionRect?: Rect

    constructor() {
        super()
        this.ratio = SaveGameManager.preferences.screenRatioFixed
        this.animationFrame = new AnimationFrame(this.canvas, this.readbackCanvas)
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            if (!this.selectionRect) return
            context.strokeStyle = 'rgba(128, 192, 192, 0.5)'
            context.lineWidth = 2
            context.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h)
        }
        EventBroker.subscribe(EventKey.SELECTION_FRAME_CHANGE, (event: SelectionFrameChangeEvent) => {
            this.selectionRect = event.rect
            this.animationFrame.notifyRedraw()
        })
    }

    reset() {
        super.reset()
        this.selectionRect = undefined
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.animationFrame.notifyRedraw()
    }
}
