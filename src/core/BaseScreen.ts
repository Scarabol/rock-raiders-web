class BaseScreen {

    gameCanvasContainer: HTMLElement;
    canvases: HTMLCanvasElement[];

    constructor() {
        this.gameCanvasContainer = document.getElementById('game-canvas-container');
        if (!this.gameCanvasContainer) throw 'Fatal error: game canvas container not found!';
        this.canvases = [];
    }

    createCanvas(zIndex: number = 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 800; // TODO derive initial size from container? or use default size?
        canvas.height = 600;
        canvas.style.zIndex = String(zIndex);
        this.canvases.push(canvas);
        this.gameCanvasContainer.appendChild(canvas);
        return canvas;
    }

    hide() {
        this.canvases.forEach((canvas) => {
            canvas.style.visibility = 'hidden';
        });
    }

    show() {
        this.canvases.forEach((canvas) => {
            canvas.style.visibility = 'visible';
        });
    }

    onResize(width: number, height: number) {
        // TODO resize all canvas
    }

}

export { BaseScreen };
