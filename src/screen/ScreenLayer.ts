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
        this.redraw();
    }

    redraw() {
        if (this.isActive() && this.onRedraw) this.onRedraw(this.context);
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

    toCanvasCoords(windowX: number, windowY: number) {
        const clientRect = this.canvas.getBoundingClientRect();
        return [windowX - clientRect.left, windowY - clientRect.top];
    }

    handlePointerEvent(eventType: string, event: PointerEvent) {
        return false;
    }

    handleKeyEvent(eventType: string, event: KeyboardEvent) {
        return false;
    }

    handleWheelEvent(eventType: string, event: WheelEvent) {
        return false;
    }

}

export class ScaledLayer extends ScreenLayer {

    fixedWidth: number;
    fixedHeight: number;

    constructor() {
        super(true);
        this.fixedWidth = 640; // TODO externalize constant
        this.fixedHeight = 480; // TODO externalize constant
    }

    toScaledCoords(windowX: number, windowY: number) {
        const [cx, cy] = this.toCanvasCoords(windowX, windowY);
        return [cx / this.scaleX(), cy / this.scaleY()];
    }

    resize(width, height) {
        super.resize(width, height);
        this.context.scale(this.scaleX(), this.scaleY());
    }

    scaleX() {
        return this.canvas.width / this.fixedWidth;
    }

    scaleY() {
        return this.canvas.height / this.fixedHeight;
    }

}
