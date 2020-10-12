import { WadLoader } from '../core/wad/WadLoader';
import { BaseScreen } from './BaseScreen';
import { ResourceManager } from '../core/ResourceManager';
import { ScreenLayer } from './ScreenLayer';

class LoadingScreen extends BaseScreen {

    layer: ScreenLayer;
    onResourcesLoaded: () => void = null;
    currentResourceIndex: number = 0;
    totalResources: number = 0;

    constructor(resourceManager: ResourceManager) {
        super(resourceManager);
        this.layer = this.createLayer();
        this.layer.onRedraw = (context) => {
            // clear the screen to black
            context.fillStyle = 'black';
            context.fillRect(0, 0, this.width, this.height);
            // draw the loading title
            context.font = '48px Arial';
            context.fillStyle = 'white';
            context.fillText('Loading Rock Raiders', 5, this.height - 80);
            // hard-code the first loading message
            context.font = '30px Arial';
            context.fillStyle = 'white';
            context.fillText('Loading...', 20, this.height - 30);
        };
    }

    startLoading() {
        this.show();
        new WadLoader(this).startWithCachedFiles(() => {
            this.hide();
            this.onResourcesLoaded();
        });
    }

    setLoadingMessage(text) {
        this.layer.onRedraw = (context) => {
            // wipe old message text
            context.fillStyle = 'black';
            context.fillRect(0, this.height - 60, this.width, 60);
            // write new message text
            context.font = '30px Arial';
            context.fillStyle = 'white';
            context.fillText(text, 20, this.height - 30);
        };
        this.redraw();
    }

    enableGraphicMode() {
        const imgBackground = this.resMgr.getImage(this.resMgr.configuration['Lego*']['Main']['LoadScreen']).canvas;
        const imgProgress = this.resMgr.getImage(this.resMgr.configuration['Lego*']['Main']['ProgressBar']).canvas;
        this.layer.onRedraw = (context => {
            const screenZoom = this.width / imgBackground.width;
            const loadingBarWidth = 353 * this.currentResourceIndex / this.totalResources * screenZoom;
            context.drawImage(imgBackground, 0, 0, this.width, this.height);
            context.drawImage(imgProgress, 142 * screenZoom, 450 * screenZoom, loadingBarWidth, 9 * screenZoom);
        });
        this.redraw();
    }

}

export { LoadingScreen };
