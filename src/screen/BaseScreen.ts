import { ScreenLayer, ScreenLayerOptions } from './ScreenLayer';
import { EventManager } from '../game/engine/EventManager';

class BaseScreen {

    eventMgr: EventManager;
    gameCanvasContainer: HTMLElement;
    layers: ScreenLayer[] = [];
    width: number = 800;
    height: number = 600;
    ratio: number = 800 / 600;

    constructor(eventManager: EventManager) {
        this.eventMgr = eventManager;
        this.gameCanvasContainer = document.getElementById('game-canvas-container');
        if (!this.gameCanvasContainer) throw 'Fatal error: game canvas container not found!';
        window.addEventListener('resize', () => this.onWindowResize());
        this.onWindowResize();
    }

    createLayer(options: Partial<ScreenLayerOptions> = {}) {
        const layer = new ScreenLayer(this.width, this.height, options);
        this.layers.push(layer);
        this.gameCanvasContainer.appendChild(layer.canvas);
        return layer;
    }

    redraw() {
        this.layers.filter(layer => layer.isActive()).forEach((layer) => layer.redraw());
    }

    show() {
        this.layers.forEach((layer) => layer.show());
        this.redraw();
    }

    hide() {
        this.layers.forEach((layer) => layer.hide());
    }

    onWindowResize() {
        const maxWidth = this.gameCanvasContainer.offsetWidth, maxHeight = this.gameCanvasContainer.offsetHeight;
        const idealHeight = Math.round(maxWidth / this.ratio);
        if (idealHeight > maxHeight) {
            this.resize(Math.round(maxHeight * this.ratio), maxHeight);
        } else {
            this.resize(maxWidth, idealHeight);
        }
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.layers.forEach((layer) => layer.resize(width, height));
        this.redraw();
    }

}

export { BaseScreen };
