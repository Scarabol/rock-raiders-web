class ScreenLayer {

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    onRedraw: (context: CanvasRenderingContext2D) => void;

    constructor(width: number, height: number, zIndex: number = 0) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.zIndex = String(zIndex);
        this.context = this.canvas.getContext('2d');
        this.hide();
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

export { ScreenLayer };
