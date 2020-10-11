class BaseScreen {

    gameCanvasContainer: HTMLElement;
    canvases: HTMLCanvasElement[];
    width: number;
    height: number;

    constructor() {
        this.gameCanvasContainer = document.getElementById('game-canvas-container');
        if (!this.gameCanvasContainer) throw 'Fatal error: game canvas container not found!';
        this.canvases = [];
    }

    createCanvas(zIndex: number = 0) {
        const canvas = document.createElement('canvas');
        canvas.width = this.width; // TODO derive initial size from container? or use default size?
        canvas.height = this.height;
        canvas.style.zIndex = String(zIndex);
        this.canvases.push(canvas);
        this.gameCanvasContainer.appendChild(canvas);
        return canvas;
    }

    redraw() {
        console.log('BaseScreen redraw called');
    };

    show() {
        this.redraw();
        this.canvases.forEach((canvas) => {
            canvas.style.visibility = 'visible';
        });
    }

    hide() {
        this.canvases.forEach((canvas) => {
            canvas.style.visibility = 'hidden';
        });
    }

    onResize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.canvases.forEach((canvas) => {
            canvas.width = width;
            canvas.height = height;
            // FIXME trigger redraw?!
        });
    }

}

export { BaseScreen };
