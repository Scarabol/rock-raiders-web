import { LoadingScreen } from './screen/LoadingScreen';
import { ResourceManager } from './game/engine/ResourceManager';
import { MainMenuScreen } from './screen/MainMenuScreen';
import { GameScreen } from './game/GameScreen';
import { RewardScreen } from './screen/RewardScreen';

// setup basic game engine structure

const loadingScreen = new LoadingScreen();
const mainMenuScreen = new MainMenuScreen();
const gameScreen = new GameScreen();
const rewardScreen = new RewardScreen();

// link all components with callbacks

ResourceManager.wadLoader.onMessage = (msg: string) => {
    loadingScreen.setLoadingMessage(msg);
};
ResourceManager.wadLoader.onInitialLoad = (totalResources: number) => {
    loadingScreen.enableGraphicMode(totalResources);
};
ResourceManager.wadLoader.onAssetLoaded = (assetIndex: number) => {
    loadingScreen.onAssetLoaded(assetIndex);
};
ResourceManager.wadLoader.onLoad = () => {
    loadingScreen.hide();
    // mainMenuScreen.showMainMenu();
    mainMenuScreen.selectLevel('Level02');
};
mainMenuScreen.onLevelSelected = (levelName) => {
    gameScreen.startLevel(levelName);
};
gameScreen.onLevelEnd = (gameResult) => {
    rewardScreen.showReward(gameResult);
};
rewardScreen.onContinue = mainMenuScreen.showLevelSelection;

// start the game engine with loading resources

loadingScreen.show();
ResourceManager.wadLoader.startWithCachedFiles();
