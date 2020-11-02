import { ScreenLayer } from '../../screen/ScreenLayer';
import { WorldManager } from '../../scene/WorldManager';

export class GameLayer extends ScreenLayer {

    private worldManager: WorldManager;

    constructor() {
        super(false, false);
    }

    setWorldManager(worldManager: WorldManager) {
        this.worldManager = worldManager;
    }

    handlePointerEvent(eventType: string, event: PointerEvent): boolean {
        if (eventType === 'pointermove') {
            const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY);
            this.moveMouseTorch(cx, cy);
        }
        this.canvas.dispatchEvent(event);
        return true;
    }

    moveMouseTorch(screenX, screenY) {
        const rx = (screenX / this.canvas.width) * 2 - 1;
        const ry = -(screenY / this.canvas.height) * 2 + 1;
        this.worldManager.moveMouseTorch(rx, ry);
    }

    handleWheelEvent(eventType: string, event: WheelEvent): boolean {
        this.canvas.dispatchEvent(event);
        return true;
    }

}
