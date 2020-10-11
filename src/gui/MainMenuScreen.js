function MainMenuScreen(resourceManager) {
    this.resMgr = resourceManager;
    this.onLevelSelected = null;
}

MainMenuScreen.prototype = {

    showMainMenu: () => {
        // FIXME merge main menu implementation from rock-raiders-remake project
        // FIXME continue with statically loading level 05 for debugging
        debugger;
        this.onLevelSelected('Level05');
    },

    showLevelSelection: () => {

    },
};

export { MainMenuScreen };
