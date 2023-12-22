import { Rect } from '../../core/Rect'
import { EventBus } from '../../event/EventBus'
import { MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { DeselectAll, SelectionChanged } from '../../event/LocalEvents'
import { WorldManager } from '../../game/WorldManager'
import { GameSelection } from '../../game/model/GameSelection'
import { AnimationFrame } from '../AnimationFrame'
import { ScreenLayer } from './ScreenLayer'
import { SelectionRaycaster } from '../../scene/SelectionRaycaster'
import { Vector2 } from 'three'

export class SelectionLayer extends ScreenLayer {
    readonly animationFrame: AnimationFrame
    worldMgr: WorldManager
    selectionRect: Rect = null

    constructor() {
        super()
        this.animationFrame = new AnimationFrame(this.canvas, this.readbackCanvas)
        this.animationFrame.onRedraw = (context) => {
            context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            if (!this.selectionRect) return
            context.strokeStyle = 'rgba(128, 192, 192, 0.5)'
            context.lineWidth = 2
            context.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h)
        }
        new Map<keyof HTMLElementEventMap, POINTER_EVENT>([
            ['pointermove', POINTER_EVENT.MOVE],
            ['pointerdown', POINTER_EVENT.DOWN],
            ['pointerup', POINTER_EVENT.UP],
            ['pointerleave', POINTER_EVENT.LEAVE],
        ]).forEach((eventEnum, eventType) => {
            this.addEventListener(eventType, (event): boolean => {
                const gameEvent = new GamePointerEvent(eventEnum, event as PointerEvent)
                ;[gameEvent.canvasX, gameEvent.canvasY] = this.transformCoords(gameEvent.clientX, gameEvent.clientY)
                return this.handlePointerEvent(gameEvent)
            })
        })
    }

    reset() {
        super.reset()
        this.selectionRect = null
    }

    resize(width: number, height: number) {
        super.resize(width, height)
        this.animationFrame.notifyRedraw()
    }

    handlePointerEvent(event: GamePointerEvent): boolean {
        if (this.worldMgr.sceneMgr.hasBuildModeSelection()) return false
        if (this.worldMgr.entityMgr.selection.canMove()) return false // TODO this prevents using selection frame while entities are selected
        if (event.pointerType === 'mouse') {
            if (event.eventEnum === POINTER_EVENT.DOWN) {
                if (event.button === MOUSE_BUTTON.MAIN) {
                    this.canvas.setPointerCapture(event.pointerId)
                    this.startSelection(event.canvasX, event.canvasY)
                    return true
                }
            } else if (event.eventEnum === POINTER_EVENT.MOVE) {
                return this.changeSelection(event.canvasX, event.canvasY)
            } else if (event.eventEnum === POINTER_EVENT.UP && event.button === MOUSE_BUTTON.MAIN) {
                return this.selectEntities(event.canvasX, event.canvasY)
            }
        } else {
            if (event.button === MOUSE_BUTTON.MAIN) {
                if (event.eventEnum === POINTER_EVENT.DOWN) {
                    this.startSelection(event.canvasX, event.canvasY)
                } else if (event.eventEnum === POINTER_EVENT.UP || event.eventEnum === POINTER_EVENT.LEAVE) {
                    if (!this.selectionRect) return false
                    if (Math.abs(event.canvasX - this.selectionRect.x) < 5 && Math.abs(event.canvasY - this.selectionRect.y) < 5) {
                        const x = (this.selectionRect.x + event.canvasX) / this.canvas.width - 1
                        const y = -(this.selectionRect.y + event.canvasY) / this.canvas.height + 1
                        this.worldMgr.entityMgr.selection.set(new SelectionRaycaster(this.worldMgr).getSelectionByRay(new Vector2(x, y)))
                        EventBus.publishEvent(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
                        this.selectionRect = null
                        this.animationFrame.notifyRedraw()
                        return true
                    }
                }
            }
        }
        return false
    }

    private startSelection(screenX: number, screenY: number) {
        this.selectionRect = new Rect(screenX, screenY)
    }

    private changeSelection(screenX: number, screenY: number) {
        if (!this.selectionRect) return false // selection was not started on this layer
        this.selectionRect.w = screenX - this.selectionRect.x
        this.selectionRect.h = screenY - this.selectionRect.y
        this.animationFrame.notifyRedraw()
        return true
    }

    private selectEntities(screenX: number, screenY: number) {
        if (!this.selectionRect) return false // selection was not started on this layer
        let entities: GameSelection
        if (Math.abs(screenX - this.selectionRect.x) < 5 && Math.abs(screenY - this.selectionRect.y) < 5) {
            const x = (this.selectionRect.x + screenX) / this.canvas.width - 1
            const y = -(this.selectionRect.y + screenY) / this.canvas.height + 1
            entities = new SelectionRaycaster(this.worldMgr).getSelectionByRay(new Vector2(x, y))
        } else {
            const r1x = (this.selectionRect.x / this.canvas.width) * 2 - 1
            const r1y = -(this.selectionRect.y / this.canvas.height) * 2 + 1
            const r2x = (screenX / this.canvas.width) * 2 - 1
            const r2y = -(screenY / this.canvas.height) * 2 + 1
            entities = this.worldMgr.sceneMgr.getEntitiesInFrustum(r1x, r1y, r2x, r2y)
        }
        this.worldMgr.entityMgr.selection.set(entities)
        EventBus.publishEvent(this.worldMgr.entityMgr.selection.isEmpty() ? new DeselectAll() : new SelectionChanged(this.worldMgr.entityMgr))
        this.selectionRect = null
        this.animationFrame.notifyRedraw()
        return true
    }
}
