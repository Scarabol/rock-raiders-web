export class ScreenLayer {

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    onRedraw: (context: CanvasRenderingContext2D) => void;

    constructor(alpha: boolean = false, withContext: boolean = true) {
        this.canvas = document.createElement('canvas');
        if (!alpha) this.canvas.style.background = '#f0f';
        if (withContext) this.context = this.canvas.getContext('2d', {alpha: alpha});
        this.hide();
    }

    setZIndex(zIndex: number) {
        this.canvas.style.zIndex = String(zIndex);
    }

    static compareZ(layerA: ScreenLayer, layerB: ScreenLayer) {
        let aIndex = layerA?.canvas?.style?.zIndex || 0;
        const bIndex = layerB?.canvas?.style?.zIndex || 0;
        return aIndex === bIndex ? 0 : aIndex > bIndex ? -1 : 1;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (this.isActive()) this.redraw();
    }

    redraw() {
        if (this.onRedraw) this.onRedraw(this.context);
    }

    show() {
        this.canvas.style.visibility = 'visible';
        this.redraw();
    }

    hide() {
        this.canvas.style.visibility = 'hidden';
    }

    isActive() {
        return this.canvas.style.visibility === 'visible';
    }

}
