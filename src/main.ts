import { LoadingScreen } from './gui/LoadingScreen';
import { ResourceManager } from './core/ResourceManager';
import { MainMenuScreen } from './gui/MainMenuScreen';
import { GameScreen } from './game/GameScreen';
import { RewardScreen } from './gui/RewardScreen';

// setup basic game engine structure

const resMgr = new ResourceManager();
const loadingScreen = new LoadingScreen(resMgr);
const mainMenuScreen = new MainMenuScreen(resMgr);
const gameScreen = new GameScreen(resMgr);
const rewardScreen = new RewardScreen(resMgr);

// link all components with callbacks

loadingScreen.onResourcesLoaded = () => {
    // mainMenuScreen.showMainMenu();
    mainMenuScreen.selectLevel('Level05'); // FIXME directly start level for debugging
};
mainMenuScreen.onLevelSelected = (levelName) => {
    gameScreen.startLevel(levelName);
};
gameScreen.onLevelEnd = (gameResult) => {
    rewardScreen.showReward(gameResult);
};
rewardScreen.onContinue = mainMenuScreen.showLevelSelection;

// start the game engine with loading resources

loadingScreen.startLoading();
