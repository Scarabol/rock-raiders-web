import { ScaledLayer } from '../../screen/ScreenLayer';
import { ResourceManager } from '../engine/ResourceManager';
import { iGet } from '../../core/Util';

export class GuiLayer extends ScaledLayer {

    constructor() {
        super(640, 480);
        this.onRedraw = (context: CanvasRenderingContext2D) => {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            const panelsCfg = ResourceManager.cfg('Panels640x480');
            Object.keys(panelsCfg).forEach((panelName) => {
                if (panelName === 'Panel_RadarOverlay' || panelName === 'Panel_Information') return;
                const [imgName, xOut, yOut, xIn, yIn] = iGet(panelsCfg, panelName); // TODO refactor to panel class with in/out state
                if (panelName === 'Panel_Messages') { // TODO no position given for this panel???
                    context.drawImage(ResourceManager.getImage(imgName), 42, 409);
                } else {
                    context.drawImage(ResourceManager.getImage(imgName), xIn, yIn);
                }
            });
        };
    }

    handlePointerEvent(eventType: string, event: PointerEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY);
        const hit = !this.context || this.context.getImageData(cx, cy, 1, 1).data[3] > 0;
        if (hit) {
            event.preventDefault();
        }
        return hit;
    }

    handleWheelEvent(eventType: string, event: WheelEvent): boolean {
        const [cx, cy] = this.toCanvasCoords(event.clientX, event.clientY);
        return !this.context || this.context.getImageData(cx, cy, 1, 1).data[3] > 0;
    }

}
