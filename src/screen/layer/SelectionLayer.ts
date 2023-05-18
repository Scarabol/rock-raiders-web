import { Rect } from '../../core/Rect'
import { EventBus } from '../../event/EventBus'
import { MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { DeselectAll, SelectionChanged } from '../../event/LocalEvents'
import { EntityManager } from '../../game/EntityManager'
import { GameSelection } from '../../game/model/GameSelection'
import { SceneManager } from '../../game/SceneManager'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenLayer } from './ScreenLayer'

export class SelectionLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrameSelection
    sceneMgr: SceneManager
    entityMgr: EntityManager
    selectionRect: Rect = null

    constructor() {
        super()
        this.animationFrame = new AnimationFrameSelection(this.canvas)
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            if (!this.selectionRect) return
            context.strokeStyle = 'rgba(128, 192, 192, 0.5)'
            context.lineWidth = 2
            context.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h)
        }
    }

    reset() {
        super.reset()
        this.selectionRect = null
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.animationFrame.redraw()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (this.sceneMgr.hasBuildModeSelection()) return false
        if (event.eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.MAIN) return this.startSelection(event.canvasX, event.canvasY)
        } else if (event.eventEnum === POINTER_EVENT.MOVE) {
            return this.changeSelection(event.canvasX, event.canvasY)
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) return this.selectEntities(event.canvasX, event.canvasY)
        }
        return false
    }

    private startSelection(screenX: number, screenY: number) {
        this.selectionRect = new Rect(screenX, screenY)
        return true
    }

    private changeSelection(screenX: number, screenY: number) {
        if (!this.selectionRect) return false // selection was not started on this layer
        this.selectionRect.w = screenX - this.selectionRect.x
        this.selectionRect.h = screenY - this.selectionRect.y
        this.animationFrame.redraw()
        return true
    }

    private selectEntities(screenX: number, screenY: number) {
        if (!this.selectionRect) return false // selection was not started on this layer
        let entities: GameSelection
        if (Math.abs(screenX - this.selectionRect.x) < 5 && Math.abs(screenY - this.selectionRect.y) < 5) {
            const x = (this.selectionRect.x + screenX) / this.canvas.width - 1
            const y = -(this.selectionRect.y + screenY) / this.canvas.height + 1
            entities = this.sceneMgr.getSelectionByRay(x, y)
        } else {
            const r1x = (this.selectionRect.x / this.canvas.width) * 2 - 1
            const r1y = -(this.selectionRect.y / this.canvas.height) * 2 + 1
            const r2x = (screenX / this.canvas.width) * 2 - 1
            const r2y = -(screenY / this.canvas.height) * 2 + 1
            entities = this.sceneMgr.getEntitiesInFrustum(r1x, r1y, r2x, r2y)
        }
        this.entityMgr.selection.set(entities)
        EventBus.publishEvent(this.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.entityMgr))
        this.selectionRect = null
        this.animationFrame.redraw()
        return true
    }
}

class AnimationFrameSelection extends AnimationFrame {
    redraw() {
        super.redraw()
        // TODO Without this console logging the selection frame may become sticky
        console.log('TODO Fix AnimationFrameSelection.redraw becomes sticky')
    }
}
