import { LoadingScreen } from './gui/LoadingScreen';
import { ResourceManager } from './core/ResourceManager';
import { MainMenuScreen } from './gui/MainMenuScreen';
import { GameScreen } from './game/GameScreen';
import { RewardScreen } from './gui/RewardScreen';


const resMgr = new ResourceManager();
const loadingScreen = new LoadingScreen(resMgr, 'loading-canvas');
const mainMenuScreen = new MainMenuScreen(resMgr, 'menu-canvas');
const gameScreen = new GameScreen(resMgr);
const rewardScreen = new RewardScreen(resMgr);
// FIXME register screens for onresize


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


loadingScreen.startLoading();
