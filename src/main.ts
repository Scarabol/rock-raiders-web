import { LoadingScreen } from './gui/LoadingScreen';
import { ResourceManager } from './core/ResourceManager';
import { MainMenuScreen } from './gui/MainMenuScreen';
import { GameScreen } from './game/GameScreen';
import { RewardScreen } from './gui/RewardScreen';

// setup basic game structure

const resMgr = new ResourceManager();
const loadingScreen = new LoadingScreen(resMgr, 'game-canvas-container');
const mainMenuScreen = new MainMenuScreen(resMgr, 'game-canvas-container');
const gameScreen = new GameScreen(resMgr, 'game-canvas-container');
const rewardScreen = new RewardScreen(resMgr, 'game-canvas-container');
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
}
rewardScreen.onContinue = mainMenuScreen.showLevelSelection;

// start the engine by loading resources

loadingScreen.startLoading();
