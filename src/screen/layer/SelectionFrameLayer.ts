import { Rect } from '../../core/Rect'
import { SelectionFrameChangeEvent } from '../../event/LocalEvents'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenLayer } from './ScreenLayer'
import { EventKey } from '../../event/EventKeyEnum'
import { EventBroker } from '../../event/EventBroker'
import { SaveGameManager } from '../../resource/SaveGameManager'
import { GameState } from '../../game/model/GameState'
import { FPV_ENTITY_TURN_SPEED } from '../../params'
import { WorldManager } from '../../game/WorldManager'

export class SelectionFrameLayer extends ScreenLayer {
    private static readonly touchControlCenterY = 0.65
    private static readonly touchControlDeadOffset = 0.025
    private static readonly touchControlMax = 0.075
    readonly animationFrame: AnimationFrame
    selectionRect: Rect | undefined
    touchControlled: number = 0 // -1 = left, 1 = right

    constructor(readonly worldMgr: WorldManager) {
        super()
        this.ratio = SaveGameManager.calcScreenRatio()
        this.animationFrame = new AnimationFrame(this.canvas, this.readbackCanvas)
        this.animationFrame.onRedraw = (context) => {
            if (this.selectionRect) {
                context.strokeStyle = 'rgba(128, 192, 192, 0.5)'
                context.lineWidth = 2
                context.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h)
            }
            if (this.touchControlled) {
                const w = this.canvas.width
                const x = w * (0.5 + this.touchControlled * 0.25)
                const h = this.canvas.height
                const y = h * 0.65
                const s = Math.max(w * SelectionFrameLayer.touchControlMax, h * SelectionFrameLayer.touchControlMax)
                context.beginPath()
                context.ellipse(x, y, s, s, 0, 0, Math.PI * 2)
                context.strokeStyle = 'rgba(0, 0, 0, 0.25)'
                context.lineWidth = Math.max(6, Math.round(Math.max(w, h) / 300) * 3)
                context.stroke()
                context.strokeStyle = 'rgba(255, 255, 255, 0.4)'
                context.lineWidth = Math.max(2, Math.round(Math.max(w, h) / 300))
                context.stroke()
            }
        }
        this.addEventListener('touchstart', (event: TouchEvent): boolean => this.handleTouchEvent(event))
        this.addEventListener('touchmove', (event: TouchEvent): boolean => this.handleTouchEvent(event))
        this.addEventListener('touchend', (): boolean => {
            if (GameState.isBirdView) return false
            this.worldMgr.sceneMgr.entityTurnSpeed = 0
            this.worldMgr.sceneMgr.entityMoveMultiplier = 0
            this.setTouchControlled(0)
            return true
        })
        EventBroker.subscribe(EventKey.SELECTION_FRAME_CHANGE, (event: SelectionFrameChangeEvent) => {
            this.selectionRect = event.rect
            this.animationFrame.notifyRedraw()
        })
    }

    override reset() {
        super.reset()
        this.selectionRect = undefined
    }

    override resize(width: number, height: number) {
        super.resize(width, height)
        this.animationFrame.notifyRedraw()
    }

    private handleTouchEvent(event: TouchEvent): boolean {
        const touch = event.touches[0]
        if (GameState.isBirdView || !touch) return false
        const [canvasX, canvasY] = this.transformCoords(touch.clientX, touch.clientY)
        const [relX, relY] = [canvasX / this.canvas.width, canvasY / this.canvas.height]
        const centerX = relX < 0.5 ? 0.25 : 0.75
        const centerY = SelectionFrameLayer.touchControlCenterY
        const deadCenter = SelectionFrameLayer.touchControlDeadOffset
        if (relY > centerY - 0.25 && relY < centerY + 0.25) { // lower half
            this.setTouchControlled(relX < 0.5 ? -1 : 1)
            if (relX < centerX - deadCenter || relX > centerX + deadCenter || relY < centerY - deadCenter || relY > centerY + deadCenter) { // dead spot in the center
                this.worldMgr.sceneMgr.entityTurnSpeed = Math.max(-1, Math.min(1, -(relX - centerX) / SelectionFrameLayer.touchControlMax)) * FPV_ENTITY_TURN_SPEED
                this.worldMgr.sceneMgr.entityMoveMultiplier = Math.max(-1, Math.min(1, -(relY - centerY) / SelectionFrameLayer.touchControlMax))
                return true
            }
        } else {
            this.setTouchControlled(0)
        }
        this.worldMgr.sceneMgr.entityTurnSpeed = 0
        this.worldMgr.sceneMgr.entityMoveMultiplier = 0
        return true
    }

    private setTouchControlled(state: number): void {
        if (this.touchControlled === state) return
        this.touchControlled = state
        this.animationFrame.notifyRedraw()
    }
}
