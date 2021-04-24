import { MOUSE_BUTTON, POINTER_EVENT } from '../../event/EventTypeEnum'
import { WorldManager } from '../../scene/WorldManager'
import { ScreenLayer } from '../../screen/ScreenLayer'
import { GameState } from '../model/GameState'

export class SelectionLayer extends ScreenLayer {

    worldManager: WorldManager
    selectStart: { x: number, y: number } = null

    constructor() {
        super(true)
    }

    reset() {
        super.reset()
        this.selectStart = null
    }

    setWorldManager(worldManager: WorldManager) {
        this.worldManager = worldManager
    }

    handlePointerEvent(eventEnum: POINTER_EVENT, event: PointerEvent): boolean {
        if (GameState.buildModeSelection) return
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY)
        if (eventEnum === POINTER_EVENT.DOWN) {
            if (event.button === MOUSE_BUTTON.MAIN) return this.startSelection(cx, cy)
        } else if (eventEnum === POINTER_EVENT.MOVE) {
            return this.changeSelection(cx, cy)
        } else if (eventEnum === POINTER_EVENT.UP) {
            if (event.button === MOUSE_BUTTON.MAIN) return this.selectEntities(cx, cy)
        }
        return false
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
            this.worldManager.sceneManager.selectEntitiesByRay(x, y)
        } else {
            this.worldManager.sceneManager.selectEntitiesInFrustum(r1x, r1y, r2x, r2y)
        }
        this.selectStart = null
        return true
    }

}
