function LoadingScreen() {
    this.loadingCanvas = document.getElementById('loadingCanvas');
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

LoadingScreen.prototype = {

    onResize() {
        // FIXME resize loading screen canvas
    },

    hide() {
        this.loadingCanvas.style.visibility = 'hidden';
    },

};

export { LoadingScreen };
