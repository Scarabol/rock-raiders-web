import { LoadingScreen } from './screen/LoadingScreen';
import { ResourceManager } from './game/engine/ResourceManager';
import { MainMenuScreen } from './screen/MainMenuScreen';
import { GameScreen } from './game/GameScreen';
import { RewardScreen } from './screen/RewardScreen';
import { EventManager } from './game/engine/EventManager';

// setup basic game engine structure

const eventMgr = new EventManager();
const loadingScreen = new LoadingScreen(eventMgr);
const mainMenuScreen = new MainMenuScreen(eventMgr);
const gameScreen = new GameScreen(eventMgr);
const rewardScreen = new RewardScreen(eventMgr);

// link all components with callbacks

ResourceManager.wadLoader.onMessage = () => loadingScreen.setLoadingMessage;
ResourceManager.wadLoader.onInitialLoad = () => loadingScreen.enableGraphicMode;
ResourceManager.wadLoader.onAssetLoaded = () => loadingScreen.onAssetLoaded;
ResourceManager.wadLoader.onLoad = () => {
    loadingScreen.hide();
    // mainMenuScreen.showMainMenu();
    mainMenuScreen.selectLevel('Level05');
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
