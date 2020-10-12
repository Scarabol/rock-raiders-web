import { ScreenLayer } from './ScreenLayer';

class BaseScreen {

    gameCanvasContainer: HTMLElement;
    layers: ScreenLayer[] = [];
    width: number = 800;
    height: number = 600;
    ratio: number = 800 / 600;

    constructor() {
        this.gameCanvasContainer = document.getElementById('game-canvas-container');
        if (!this.gameCanvasContainer) throw 'Fatal error: game canvas container not found!';
        window.addEventListener('resize', () => this.onWindowResize);
        this.onWindowResize();
    }

    createLayer(zIndex: number = 0) {
        const layer = new ScreenLayer(this.width, this.height, zIndex);
        this.layers.push(layer);
        this.gameCanvasContainer.appendChild(layer.canvas);
        return layer;
    }

    redraw() {
        this.layers.filter(layer => layer.active).forEach((layer) => {
            layer.redraw();
        });
    }

    show() {
        this.layers.filter(layer => layer.active).forEach((layer) => {
            layer.show();
        });
        this.redraw();
    }

    hide() {
        this.layers.forEach((canvas) => {
            canvas.hide();
        });
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
        console.log('resize to ' + width + ' x ' + height);
        this.width = width;
        this.height = height;
        this.layers.filter(layer => layer.active).forEach((layer) => {
            layer.resize(width, height);
        });
        this.redraw();
    }

}

export { BaseScreen };
