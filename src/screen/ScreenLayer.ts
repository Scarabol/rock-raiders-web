export class ScreenLayerOptions {

    zIndex: number;
    withContext: boolean;
    alpha: boolean;

}

export class ScreenLayer {

    zIndex: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    onRedraw: (context: CanvasRenderingContext2D) => void;

    constructor(width: number, height: number, options: Partial<ScreenLayerOptions>) {
        const opts: ScreenLayerOptions = {zIndex: 0, withContext: true, alpha: false};
        Object.keys(options).filter(k => options[k] !== undefined).forEach(k => opts[k] = options[k]);
        this.zIndex = opts.zIndex;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.zIndex = String(opts.zIndex);
        if (!opts.alpha) this.canvas.style.background = '#f0f';
        if (opts.withContext) this.context = this.canvas.getContext('2d', {alpha: opts.alpha});
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
