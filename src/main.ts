import { LoadingScreen } from './gui/LoadingScreen';
import { ResourceManager } from './core/ResourceManager';
import { MainMenuScreen } from './gui/MainMenuScreen';
import { GameScreen } from './game/GameScreen';
import { RewardScreen } from './gui/RewardScreen';

// setup basic game structure

const resMgr = new ResourceManager();
const loadingScreen = new LoadingScreen(resMgr);
const mainMenuScreen = new MainMenuScreen();
const gameScreen = new GameScreen();
const rewardScreen = new RewardScreen();
// FIXME register screens for onresize

// link all components with callbacks

loadingScreen.onResourcesLoaded = () => {
    // mainMenuScreen.showMainMenu(); // FIXME directly start level for debugging
    mainMenuScreen.selectLevel('Level05');
};
mainMenuScreen.onLevelSelected = (levelName) => {
    gameScreen.startLevel(levelName);
};
gameScreen.onLevelEnd = (gameResult) => {
    rewardScreen.showReward(gameResult);
};
rewardScreen.onContinue = mainMenuScreen.showLevelSelection;

// start the engine by loading resources

loadingScreen.startLoading();
