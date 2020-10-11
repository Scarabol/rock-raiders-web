import { startWithCachedFiles } from '../core/wad/WadLoader';
import { ResourceManager } from "../core/ResourceManager";

class LoadingScreen {
    onResourcesLoaded: any = null;
    loadingCanvas: HTMLCanvasElement;

    constructor(resourceManager: ResourceManager, gameCanvasContainerId: string) {
        const canvasContainer = document.getElementById(gameCanvasContainerId);
        this.loadingCanvas = document.createElement('canvas');
        canvasContainer.appendChild(this.loadingCanvas);
        this.loadingCanvas.id = 'loading-canvas'; // TODO refactor WadLoader to use LoadingScreen class instead of direct drawing
        this.loadingCanvas.width = 800;
        this.loadingCanvas.height = 600;
        const loadingContext = this.loadingCanvas.getContext('2d');

        // clear the screen to black
        loadingContext.fillStyle = 'black';
        loadingContext.fillRect(0, 0, this.loadingCanvas.width, this.loadingCanvas.height);

        // draw the loading title
        loadingContext.font = '48px Arial';
        loadingContext.fillStyle = 'white';
        loadingContext.fillText('Loading Rock Raiders', 5, this.loadingCanvas.height - 80);

        // hard-code the first loading message
        loadingContext.font = '30px Arial';
        loadingContext.fillStyle = 'white';
        loadingContext.fillText('Loading...', 20, this.loadingCanvas.height - 30);
    }

    startLoading() {
        startWithCachedFiles(() => {
            this.loadingCanvas.style.visibility = 'hidden';
            this.onResourcesLoaded();
        });
    }

    onResize() {
        // FIXME resize loading screen canvas
    }

    hide() {
        this.loadingCanvas.style.visibility = 'hidden';
    }

}

export { LoadingScreen };
