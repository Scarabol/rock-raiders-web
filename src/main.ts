import { ResourceManager } from './resource/ResourceManager';
import { LoadingScreen } from './screen/LoadingScreen';
import { MainMenuScreen } from './screen/MainMenuScreen';
import { GameScreen } from './screen/GameScreen';
import { RewardScreen } from './screen/RewardScreen';

const loadingScreen = new LoadingScreen();

// link all components

ResourceManager.onMessage = (msg: string) => {
    loadingScreen.setLoadingMessage(msg);
};
ResourceManager.onInitialLoad = (totalResources: number) => {
    loadingScreen.enableGraphicMode(totalResources);
};
ResourceManager.onAssetLoaded = (assetIndex: number) => {
    loadingScreen.onAssetLoaded(assetIndex);
};
ResourceManager.onLoadDone = () => {
    // complete setup
    const mainMenuScreen = new MainMenuScreen();
    const gameScreen = new GameScreen();
    const rewardScreen = new RewardScreen();

    mainMenuScreen.onLevelSelected = (levelName) => {
        gameScreen.startLevel(levelName);
    };
    gameScreen.onLevelEnd = (gameResult) => {
        rewardScreen.showReward(gameResult);
    };
    rewardScreen.onContinue = mainMenuScreen.showLevelSelection;

    // setup complete
    loadingScreen.hide();
    // mainMenuScreen.showMainMenu();
    mainMenuScreen.selectLevel('Level02');
};

// start the game engine with loading resources

loadingScreen.show();
ResourceManager.startLoading('./LegoRR0.wad', './LegoRR1.wad'); // TODO use input elements to define URLs
