function GameScreen(resourceManager) {
    this.resMgr = resourceManager;
    this.onLevelEnd = null;
}

GameScreen.prototype = {

    startLevel(levelName) {
        console.log('Starting level ' + levelName);
    },

};

export { GameScreen };
