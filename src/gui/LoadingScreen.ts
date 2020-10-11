import { WadLoader } from '../core/wad/WadLoader';
import { BaseScreen } from '../core/BaseScreen';
import { ResourceManager } from '../core/ResourceManager';

class LoadingScreen extends BaseScreen {

    resourceManager: ResourceManager;
    loadingContext: CanvasRenderingContext2D;
    imgBackground: HTMLCanvasElement;
    imgProgress: HTMLCanvasElement;
    onResourcesLoaded: () => void = null;

    constructor(resourceManager: ResourceManager) {
        super();
        this.resourceManager = resourceManager;
        const loadingCanvas = this.createCanvas();
        this.loadingContext = loadingCanvas.getContext('2d');
    }

    startLoading() {
        // this.show(); // TODO maybe needed because screens are create invis by default?
        new WadLoader(this.resourceManager).startWithCachedFiles((message) => {
            this.setLoadingMessage(message);
        }, (currentResourceIndex, totalResources) => {
            this.setProgress(currentResourceIndex, totalResources);
        }, () => {
            this.hide();
            this.onResourcesLoaded();
        });
    }

    setLoadingMessage(text) {
        // clear the lower portion of the canvas and update the loading status
        this.loadingContext.fillStyle = 'black';
        this.loadingContext.fillRect(0, this.height - 70, this.width, 50);
        this.loadingContext.fillStyle = 'white';
        this.loadingContext.fillText(text, 20, this.height - 30);
    }

    setProgress(currentResourceIndex, totalResources) {
        // TODO only load images once!
        this.imgBackground = this.resourceManager.getImage(this.resourceManager.configuration['Lego*']['Main']['LoadScreen']).canvas;
        this.imgProgress = this.resourceManager.getImage(this.resourceManager.configuration['Lego*']['Main']['ProgressBar']).canvas;
        const screenZoom = this.width / this.imgBackground.width;
        const loadingBarX = 142 * screenZoom;
        const loadingBarY = 450 * screenZoom;
        const loadingBarWidth = 353 * currentResourceIndex / totalResources * screenZoom;
        const loadingBarHeight = 9 * screenZoom;
        this.loadingContext.drawImage(this.imgBackground, 0, 0, this.width, this.height);
        this.loadingContext.drawImage(this.imgProgress, loadingBarX, loadingBarY, loadingBarWidth, loadingBarHeight);
    }

    redraw() {
        super.redraw();
        console.log('LoadingScreen redraw called');
        // clear the screen to black
        this.loadingContext.fillStyle = 'black';
        this.loadingContext.fillRect(0, 0, this.width, this.height);

        // draw the loading title
        this.loadingContext.font = '48px Arial';
        this.loadingContext.fillStyle = 'white';
        this.loadingContext.fillText('Loading Rock Raiders', 5, this.height - 80);

        // hard-code the first loading message
        this.loadingContext.font = '30px Arial';
        this.loadingContext.fillStyle = 'white';
        this.loadingContext.fillText('Loading...', 20, this.height - 30);
    }

}

export { LoadingScreen };
