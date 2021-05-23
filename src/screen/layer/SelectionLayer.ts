import { MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { GamePointerEvent } from '../../event/GamePointerEvent'
import { SceneManager } from '../../game/SceneManager'
import { WorldManager } from '../../game/WorldManager'
import { ScreenLayer } from './ScreenLayer'

export class SelectionLayer extends ScreenLayer {

    worldMgr: WorldManager
    sceneMgr: SceneManager
    selectStart: { x: number, y: number } = null

    constructor() {
        super(true, true)
    }

    reset() {
        super.reset()
        this.selectStart = null
    }

    handlePointerEvent(event: GamePointerEvent): Promise<boolean> {
        if (this.worldMgr.buildModeSelection) return new Promise((resolve) => resolve(false))
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        if (event.eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.MAIN) return new Promise((resolve) => resolve(this.startSelection(cx, cy)))
        } else if (event.eventEnum === POINTER_EVENT.MOVE) {
            return new Promise((resolve) => resolve(this.changeSelection(cx, cy)))
        } else if (event.eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) return new Promise((resolve) => resolve(this.selectEntities(cx, cy)))
        }
        return new Promise((resolve) => resolve(false))
    }

    startSelection(screenX: number, screenY: number) {
        this.selectStart = {x: screenX, y: screenY}
        return true
    }

    changeSelection(screenX: number, screenY: number) {
        if (!this.selectStart) return false // selection was not started on this layer
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context.strokeStyle = 'rgba(128, 192, 192, 0.5)'
        this.context.lineWidth = 2
        this.context.strokeRect(this.selectStart.x, this.selectStart.y, screenX - this.selectStart.x, screenY - this.selectStart.y)
        return true
    }

    selectEntities(screenX: number, screenY: number) {
        if (!this.selectStart) return false // selection was not started on this layer
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        const r1x = (this.selectStart.x / this.canvas.width) * 2 - 1
        const r1y = -(this.selectStart.y / this.canvas.height) * 2 + 1
        const r2x = (screenX / this.canvas.width) * 2 - 1
        const r2y = -(screenY / this.canvas.height) * 2 + 1
        if (Math.abs(screenX - this.selectStart.x) < 5 && Math.abs(screenY - this.selectStart.y) < 5) {
            const x = (this.selectStart.x + screenX) / this.canvas.width - 1
            const y = -(this.selectStart.y + screenY) / this.canvas.height + 1
            this.sceneMgr.selectEntitiesByRay(x, y)
        } else {
            this.sceneMgr.selectEntitiesInFrustum(r1x, r1y, r2x, r2y)
        }
        this.selectStart = null
        return true
    }

}
