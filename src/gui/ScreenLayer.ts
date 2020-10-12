class ScreenLayer {

    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    active: boolean;

    constructor(width: number, height: number, zIndex: number = 0) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.zIndex = String(zIndex);
        this.context = this.canvas.getContext('2d');
        this.hide();
    }

    resize(width, height) {
        console.log('resize layer to ' + width + ' x ' + height);
        this.canvas.width = width;
        this.canvas.height = height;
        this.redraw();
    }

    redraw() {
        console.log('Redrawing layer');
        this.onRedraw(this.context);
    }

    onRedraw(context: CanvasRenderingContext2D) {
    }

    show() {
        this.canvas.style.visibility = 'visible';
        this.active = true;
        // TODO resize to screen size
    }

    hide() {
        this.canvas.style.visibility = 'hidden';
        this.active = false;
    }

}

export { ScreenLayer };
