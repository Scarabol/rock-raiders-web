import { startWithCachedFiles } from '../core/wad/WadLoader';
import { BaseScreen } from '../core/BaseScreen';

class LoadingScreen extends BaseScreen {

    onResourcesLoaded: any = null;
    loadingCanvas: HTMLCanvasElement;

    constructor() {
        super();
        this.loadingCanvas = this.createCanvas();
        this.loadingCanvas.id = 'loading-canvas'; // TODO refactor WadLoader to use LoadingScreen class instead of direct drawing
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
        // this.show(); // TODO maybe needed because screens are create invis by default?
        startWithCachedFiles(() => {
            this.hide();
            this.onResourcesLoaded();
        });
    }

    onResize() {
        // FIXME resize loading screen canvas
    }

}

export { LoadingScreen };
