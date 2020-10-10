import { loadWadFiles, startWithCachedFiles } from './core/wad/WadLoader';

const loadingCanvas = document.getElementById('loadingCanvas');
loadingCanvas.width = 800;
loadingCanvas.height = 600;
const loadingContext = loadingCanvas.getContext('2d');

// clear the screen to black
loadingContext.fillStyle = 'black';
loadingContext.fillRect(0, 0, loadingCanvas.width, loadingCanvas.height);

// draw the loading title
loadingContext.font = '48px Arial';
loadingContext.fillStyle = 'white';
loadingContext.fillText('Loading Rock Raiders', 5, loadingCanvas.height - 80);

// hard-code the first loading message as assets will always be stored in assets.js
loadingContext.font = '30px Arial';
loadingContext.fillStyle = 'white';
loadingContext.fillText('loading', 20, loadingCanvas.height - 30);

startWithCachedFiles(() => {
    // as fallback load wad files from local URL
    loadWadFiles('./LegoRR0.wad', './LegoRR1.wad');
});
