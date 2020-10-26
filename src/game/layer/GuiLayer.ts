import { ScaledLayer } from '../../screen/ScreenLayer';
import { ResourceManager } from '../engine/ResourceManager';
import { iGet } from '../../core/Util';
import { Panel } from '../../gui/Panel';

export class GuiLayer extends ScaledLayer {

    panels: Panel[] = [];

    constructor() {
        super(640, 480);
        const panelsCfg = ResourceManager.cfg('Panels640x480');
        Object.keys(panelsCfg).forEach((panelName) => {
            const panelCfg = iGet(panelsCfg, panelName);
            this.panels.push(new Panel(panelName, panelCfg));
        });
        this.onRedraw = (context: CanvasRenderingContext2D) => {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            this.panels.forEach((panel) => panel.redraw(context));
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
