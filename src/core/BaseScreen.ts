class BaseScreen {

    gameCanvasContainer: HTMLElement;
    canvases: HTMLCanvasElement[];
    width: number = 800;
    height: number = 600;
    ratio: number = 800 / 600;

    constructor() {
        this.gameCanvasContainer = document.getElementById('game-canvas-container');
        if (!this.gameCanvasContainer) throw 'Fatal error: game canvas container not found!';
        this.canvases = [];
        window.addEventListener('resize', this.onWindowResize);
        this.onWindowResize();
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
    }

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
        this.canvases.forEach((canvas) => {
            canvas.width = width;
            canvas.height = height;
        });
        this.redraw();
    }

}

export { BaseScreen };
